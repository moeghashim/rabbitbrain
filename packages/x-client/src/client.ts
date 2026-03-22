import { XProviderError } from "./errors.js";
import { toXProviderError, toXProviderErrorFromPayload } from "./provider-errors.js";
import { toPositiveNumber, toTweetMediaType } from "./tweet-media-utils.js";
import { parseTweetPublicMetrics } from "./tweet-public-metrics.js";
import type {
	AccountTimelineProvider,
	FetchLike,
	ThreadPayload,
	TweetMedia,
	TweetPayload,
	XApiConfig,
	XProviderWarningReporter,
	XUserPayload,
} from "./types.js";

function readRequiredEnv(name: "X_API_KEY" | "X_API_SECRET" | "X_BEARER_TOKEN", env: NodeJS.ProcessEnv): string {
	const value = env[name];
	if (!value || value.trim().length === 0) {
		throw new XProviderError({
			code: "CONFIG_ERROR",
			message: `Missing required environment variable: ${name}`,
			retryable: false,
		});
	}
	return value.trim();
}

export function readXApiConfigFromEnv(env: NodeJS.ProcessEnv = process.env): XApiConfig {
	return {
		apiKey: readRequiredEnv("X_API_KEY", env),
		apiSecret: readRequiredEnv("X_API_SECRET", env),
		bearerToken: readRequiredEnv("X_BEARER_TOKEN", env),
		timeoutMs: Number(env.X_TIMEOUT_MS ?? "8000"),
		retryCount: Number(env.X_RETRY_COUNT ?? "2"),
		retryBaseDelayMs: Number(env.X_RETRY_BASE_DELAY_MS ?? "250"),
	};
}

function parseTweetId(input: string): string {
	const trimmed = input.trim();
	if (/^\d+$/.test(trimmed)) {
		return trimmed;
	}

	const match = trimmed.match(/status\/(\d+)/i);
	if (!match?.[1]) {
		throw new XProviderError({
			code: "INVALID_INPUT",
			message: `Invalid tweet URL or ID: ${input}`,
			retryable: false,
		});
	}

	return match[1];
}

function sanitizeUsername(input: string): string {
	const trimmed = input.trim().replace(/^@+/, "");
	if (!trimmed) {
		throw new XProviderError({
			code: "INVALID_INPUT",
			message: `Invalid username: ${input}`,
			retryable: false,
		});
	}
	return trimmed;
}

function jitterDelay(baseMs: number, randomFn: () => number): number {
	const jitter = Math.floor(randomFn() * 40);
	return baseMs + jitter;
}

async function defaultSleep(ms: number): Promise<void> {
	await new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
}

function defaultWarningReporter(event: {
	code: string;
	tweetId?: string;
	mediaKeys: string[];
	includesMediaCount: number;
}): void {
	console.warn(JSON.stringify({ scope: "x_client.media_fallback", ...event }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function toNonEmptyString(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function parseTimestamp(value: string | undefined): number {
	if (!value) {
		return Number.POSITIVE_INFINITY;
	}
	const parsed = Date.parse(value);
	return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function compareTweetsChronologically(left: TweetPayload, right: TweetPayload): number {
	const leftTimestamp = parseTimestamp(left.createdAt);
	const rightTimestamp = parseTimestamp(right.createdAt);
	if (leftTimestamp !== rightTimestamp) {
		return leftTimestamp - rightTimestamp;
	}
	return left.id.localeCompare(right.id);
}

function readTweetMedia({
	data,
	includes,
	reportWarning,
}: {
	data: Record<string, unknown>;
	includes: unknown;
	reportWarning: XProviderWarningReporter;
}): TweetMedia[] | undefined {
	const tweetId = toNonEmptyString(data.id);
	const attachments = isRecord(data.attachments) ? data.attachments : undefined;
	const mediaKeysRaw = attachments ? attachments.media_keys : undefined;
	if (!Array.isArray(mediaKeysRaw) || mediaKeysRaw.length === 0) {
		return undefined;
	}

	const mediaKeys = mediaKeysRaw
		.map((key) => (typeof key === "string" ? key.trim() : ""))
		.filter((key) => key.length > 0);
	if (mediaKeys.length === 0) {
		return undefined;
	}

	if (!isRecord(includes) || !Array.isArray(includes.media)) {
		reportWarning({
			code: "MEDIA_METADATA_MISSING",
			tweetId,
			mediaKeys,
			includesMediaCount: 0,
		});
		return undefined;
	}

	const byMediaKey = new Map<string, TweetMedia>();
	for (const entry of includes.media) {
		if (!isRecord(entry)) {
			continue;
		}

		const mediaKey = toNonEmptyString(entry.media_key);
		const mediaType = toTweetMediaType(entry.type);
		if (!mediaKey || !mediaType) {
			continue;
		}

		const media: TweetMedia = {
			mediaKey,
			type: mediaType,
		};

		const url = toNonEmptyString(entry.url);
		if (url) {
			media.url = url;
		}

		const previewImageUrl = toNonEmptyString(entry.preview_image_url);
		if (previewImageUrl) {
			media.previewImageUrl = previewImageUrl;
		}

		const altText = toNonEmptyString(entry.alt_text);
		if (altText) {
			media.altText = altText;
		}

		const width = toPositiveNumber(entry.width);
		if (width) {
			media.width = width;
		}

		const height = toPositiveNumber(entry.height);
		if (height) {
			media.height = height;
		}

		byMediaKey.set(mediaKey, media);
	}

	const ordered = mediaKeys.map((key) => byMediaKey.get(key)).filter((item): item is TweetMedia => item !== undefined);
	if (ordered.length === 0) {
		reportWarning({
			code: "MEDIA_KEYS_UNRESOLVED",
			tweetId,
			mediaKeys,
			includesMediaCount: includes.media.length,
		});
		return undefined;
	}

	return ordered;
}

function readInReplyToTweetId(data: Record<string, unknown>): string | undefined {
	const referencedTweets = Array.isArray(data.referenced_tweets) ? data.referenced_tweets : [];
	for (const entry of referencedTweets) {
		if (!isRecord(entry)) {
			continue;
		}
		if (entry.type === "replied_to") {
			return toNonEmptyString(entry.id);
		}
	}
	return undefined;
}

function readTweetPayloadFromRecord({
	data,
	includes,
	reportWarning,
	raw,
}: {
	data: Record<string, unknown>;
	includes: unknown;
	reportWarning: XProviderWarningReporter;
	raw: unknown;
}): TweetPayload {
	const id = data.id;
	const text = data.text;
	const authorId = data.author_id;
	const users =
		typeof includes === "object" && includes !== null ? (includes as { users?: unknown }).users : undefined;
	const matchingUser =
		Array.isArray(users) && typeof authorId === "string"
			? users.find((entry) => {
					if (typeof entry !== "object" || entry === null) {
						return false;
					}
					const userId = (entry as { id?: unknown }).id;
					return userId === authorId;
				})
			: undefined;
	const authorUsername =
		typeof matchingUser === "object" && matchingUser !== null
			? (matchingUser as { username?: unknown }).username
			: undefined;
	const authorName =
		typeof matchingUser === "object" && matchingUser !== null ? (matchingUser as { name?: unknown }).name : undefined;
	const authorAvatarUrl =
		typeof matchingUser === "object" && matchingUser !== null
			? (matchingUser as { profile_image_url?: unknown }).profile_image_url
			: undefined;

	if (typeof id !== "string" || id.length === 0 || typeof text !== "string" || text.length === 0) {
		throw toXProviderErrorFromPayload(raw, "X API payload is missing required tweet fields.");
	}

	const media = readTweetMedia({
		data,
		includes,
		reportWarning,
	});

	const publicMetrics = parseTweetPublicMetrics(data.public_metrics);

	return {
		id,
		text,
		authorId: typeof authorId === "string" && authorId.length > 0 ? authorId : undefined,
		authorUsername: typeof authorUsername === "string" && authorUsername.length > 0 ? authorUsername : undefined,
		authorName: typeof authorName === "string" && authorName.length > 0 ? authorName : undefined,
		authorAvatarUrl: typeof authorAvatarUrl === "string" && authorAvatarUrl.length > 0 ? authorAvatarUrl : undefined,
		createdAt: toNonEmptyString(data.created_at),
		conversationId: toNonEmptyString(data.conversation_id),
		inReplyToTweetId: readInReplyToTweetId(data),
		media,
		publicMetrics,
		raw,
	};
}

function readTweetPayload(responseBody: unknown, reportWarning: XProviderWarningReporter): TweetPayload {
	if (typeof responseBody !== "object" || responseBody === null) {
		throw new XProviderError({
			code: "UPSTREAM_ERROR",
			message: "X API returned an invalid payload.",
			retryable: false,
		});
	}

	const data = (responseBody as { data?: unknown }).data;
	if (!isRecord(data)) {
		throw toXProviderErrorFromPayload(responseBody, "X API payload missing data object.");
	}

	return readTweetPayloadFromRecord({
		data,
		includes: (responseBody as { includes?: unknown }).includes,
		reportWarning,
		raw: responseBody,
	});
}

function readUserPayload(responseBody: unknown): XUserPayload {
	if (!isRecord(responseBody)) {
		throw new XProviderError({
			code: "UPSTREAM_ERROR",
			message: "X API returned an invalid payload.",
			retryable: false,
		});
	}

	const data = responseBody.data;
	if (!isRecord(data)) {
		throw toXProviderErrorFromPayload(responseBody, "X API payload missing user data.");
	}

	const id = toNonEmptyString(data.id);
	const username = toNonEmptyString(data.username);
	if (!id || !username) {
		throw toXProviderErrorFromPayload(responseBody, "X API payload missing required user fields.");
	}

	return {
		id,
		username,
		name: toNonEmptyString(data.name),
		avatarUrl: toNonEmptyString(data.profile_image_url),
		raw: responseBody,
	};
}

function readTweetArrayPayload(responseBody: unknown, reportWarning: XProviderWarningReporter): TweetPayload[] {
	if (!isRecord(responseBody)) {
		throw new XProviderError({
			code: "UPSTREAM_ERROR",
			message: "X API returned an invalid payload.",
			retryable: false,
		});
	}

	const data = responseBody.data;
	if (data === undefined) {
		if (Array.isArray(responseBody.errors) && responseBody.errors.length > 0) {
			throw toXProviderErrorFromPayload(responseBody, "X API payload missing data array.");
		}
		return [];
	}
	if (!Array.isArray(data)) {
		throw toXProviderErrorFromPayload(responseBody, "X API payload missing data array.");
	}

	const includes = responseBody.includes;
	return data
		.filter((entry): entry is Record<string, unknown> => isRecord(entry))
		.map((entry) =>
			readTweetPayloadFromRecord({
				data: entry,
				includes,
				reportWarning,
				raw: entry,
			}),
		);
}

function dedupeTweetsById(tweets: TweetPayload[]): TweetPayload[] {
	const seen = new Set<string>();
	const deduped: TweetPayload[] = [];
	for (const tweet of tweets) {
		if (seen.has(tweet.id)) {
			continue;
		}
		seen.add(tweet.id);
		deduped.push(tweet);
	}
	return deduped;
}

function toThreadPayload(rootTweet: TweetPayload, tweets: TweetPayload[]): ThreadPayload {
	const deduped = dedupeTweetsById([rootTweet, ...tweets]).sort(compareTweetsChronologically);
	return {
		rootTweetId: rootTweet.id,
		tweets: deduped,
	};
}

function findRootTweet(thread: ThreadPayload): TweetPayload {
	return (
		thread.tweets.find((tweet) => tweet.id === thread.rootTweetId) ??
		thread.tweets[0] ?? {
			id: thread.rootTweetId,
			text: "",
			raw: thread,
		}
	);
}

export function buildThreadAnalysisText(thread: ThreadPayload): string {
	return thread.tweets
		.map((tweet, index) => {
			const authorLabel = tweet.authorUsername ? `@${tweet.authorUsername}` : "Unknown author";
			return `[${index + 1}/${thread.tweets.length}] ${authorLabel}\n${tweet.text.trim()}`;
		})
		.join("\n\n")
		.trim();
}

export function buildThreadAnalysisPayload(thread: ThreadPayload): TweetPayload {
	const rootTweet = findRootTweet(thread);
	return {
		...rootTweet,
		text: buildThreadAnalysisText(thread),
		raw: {
			rootTweet: rootTweet.raw,
			thread,
		},
	};
}

export class XApiV2Client implements AccountTimelineProvider {
	private readonly config: XApiConfig;
	private readonly fetchFn: FetchLike;
	private readonly sleepFn: (ms: number) => Promise<void>;
	private readonly randomFn: () => number;
	private readonly warningReporter: XProviderWarningReporter;

	constructor({
		config = readXApiConfigFromEnv(),
		fetchFn,
		sleepFn = defaultSleep,
		randomFn = Math.random,
		warningReporter = defaultWarningReporter,
	}: {
		config?: XApiConfig;
		fetchFn?: FetchLike;
		sleepFn?: (ms: number) => Promise<void>;
		randomFn?: () => number;
		warningReporter?: XProviderWarningReporter;
	} = {}) {
		this.config = config;
		this.fetchFn = fetchFn ?? (fetch as unknown as FetchLike);
		this.sleepFn = sleepFn;
		this.randomFn = randomFn;
		this.warningReporter = warningReporter;
	}

	private createTweetUrl(tweetId: string): URL {
		const url = new URL(`https://api.x.com/2/tweets/${tweetId}`);
		url.searchParams.set("expansions", "author_id,attachments.media_keys");
		url.searchParams.set(
			"tweet.fields",
			"author_id,attachments,public_metrics,created_at,conversation_id,referenced_tweets",
		);
		url.searchParams.set("user.fields", "id,username,name,profile_image_url");
		url.searchParams.set("media.fields", "type,url,preview_image_url,alt_text,width,height");
		return url;
	}

	private createThreadSearchUrl(query: string, nextToken?: string): URL {
		const url = new URL("https://api.x.com/2/tweets/search/recent");
		url.searchParams.set("query", query);
		url.searchParams.set("max_results", "100");
		url.searchParams.set("expansions", "author_id,attachments.media_keys");
		url.searchParams.set(
			"tweet.fields",
			"author_id,attachments,public_metrics,created_at,conversation_id,referenced_tweets",
		);
		url.searchParams.set("user.fields", "id,username,name,profile_image_url");
		url.searchParams.set("media.fields", "type,url,preview_image_url,alt_text,width,height");
		if (nextToken) {
			url.searchParams.set("next_token", nextToken);
		}
		return url;
	}

	private createUserByUsernameUrl(username: string): URL {
		const url = new URL(`https://api.x.com/2/users/by/username/${encodeURIComponent(username)}`);
		url.searchParams.set("user.fields", "id,username,name,profile_image_url");
		return url;
	}

	private createUserTweetsUrl(userId: string, limit: number): URL {
		const url = new URL(`https://api.x.com/2/users/${encodeURIComponent(userId)}/tweets`);
		url.searchParams.set("max_results", String(Math.max(5, Math.min(limit, 100))));
		url.searchParams.set("expansions", "author_id,attachments.media_keys");
		url.searchParams.set(
			"tweet.fields",
			"author_id,attachments,public_metrics,created_at,conversation_id,referenced_tweets",
		);
		url.searchParams.set("user.fields", "id,username,name,profile_image_url");
		url.searchParams.set("media.fields", "type,url,preview_image_url,alt_text,width,height");
		return url;
	}

	private async requestJson(url: URL): Promise<unknown> {
		let attempt = 0;
		while (attempt <= this.config.retryCount) {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
			try {
				const response = await this.fetchFn(url.toString(), {
					method: "GET",
					headers: {
						Authorization: `Bearer ${this.config.bearerToken}`,
						"x-api-key": this.config.apiKey,
						"x-api-secret": this.config.apiSecret,
					},
					signal: controller.signal,
				});
				if (response.ok) {
					return await response.json();
				}

				const error = toXProviderError(response.status, await response.text());
				if (!error.retryable || attempt >= this.config.retryCount) {
					throw error;
				}
				const delay = jitterDelay(this.config.retryBaseDelayMs * (attempt + 1), this.randomFn);
				await this.sleepFn(delay);
				attempt += 1;
			} catch (error) {
				if (error instanceof XProviderError) {
					throw error;
				}

				const networkError = new XProviderError({
					code: "NETWORK_ERROR",
					message: error instanceof Error ? error.message : String(error),
					retryable: attempt < this.config.retryCount,
				});
				if (!networkError.retryable) {
					throw networkError;
				}
				const delay = jitterDelay(this.config.retryBaseDelayMs * (attempt + 1), this.randomFn);
				await this.sleepFn(delay);
				attempt += 1;
			} finally {
				clearTimeout(timeout);
			}
		}

		throw new XProviderError({
			code: "UPSTREAM_ERROR",
			message: "X API request exhausted retries.",
			retryable: false,
		});
	}

	async getTweetByUrlOrId(input: string): Promise<TweetPayload> {
		const tweetId = parseTweetId(input);
		const responseBody = await this.requestJson(this.createTweetUrl(tweetId));
		return readTweetPayload(responseBody, this.warningReporter);
	}

	async getThreadByUrlOrId(input: string): Promise<ThreadPayload> {
		const rootTweet = await this.getTweetByUrlOrId(input);
		const conversationId = rootTweet.conversationId;
		const authorUsername = rootTweet.authorUsername;
		if (!conversationId || !authorUsername) {
			return {
				rootTweetId: rootTweet.id,
				tweets: [rootTweet],
			};
		}

		const query = `conversation_id:${conversationId} from:${authorUsername}`;
		const tweets: TweetPayload[] = [];
		let nextToken: string | undefined;
		do {
			const responseBody = await this.requestJson(this.createThreadSearchUrl(query, nextToken));
			const pageTweets = readTweetArrayPayload(responseBody, this.warningReporter);
			tweets.push(...pageTweets);
			nextToken =
				isRecord(responseBody) && isRecord(responseBody.meta)
					? toNonEmptyString(responseBody.meta.next_token)
					: undefined;
		} while (nextToken);

		return toThreadPayload(rootTweet, tweets);
	}

	async getUserByUsername(username: string): Promise<XUserPayload> {
		const responseBody = await this.requestJson(this.createUserByUsernameUrl(sanitizeUsername(username)));
		return readUserPayload(responseBody);
	}

	async getLatestPostsByUsername(username: string, limit: number): Promise<TweetPayload[]> {
		const user = await this.getUserByUsername(username);
		const responseBody = await this.requestJson(this.createUserTweetsUrl(user.id, limit));
		return readTweetArrayPayload(responseBody, this.warningReporter).slice(0, Math.max(1, limit));
	}
}
