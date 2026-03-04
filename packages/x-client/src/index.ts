export type XProviderErrorCode =
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "NOT_FOUND"
	| "RATE_LIMITED"
	| "UPSTREAM_ERROR"
	| "INVALID_INPUT"
	| "CONFIG_ERROR"
	| "NETWORK_ERROR";

export class XProviderError extends Error {
	readonly code: XProviderErrorCode;
	readonly status?: number;
	readonly retryable: boolean;

	constructor({
		code,
		message,
		status,
		retryable,
	}: { code: XProviderErrorCode; message: string; status?: number; retryable: boolean }) {
		super(message);
		this.name = "XProviderError";
		this.code = code;
		this.status = status;
		this.retryable = retryable;
	}
}

export interface XApiConfig {
	apiKey: string;
	apiSecret: string;
	bearerToken: string;
	timeoutMs: number;
	retryCount: number;
	retryBaseDelayMs: number;
}

export type TweetMediaType = "photo" | "video" | "animated_gif";

export interface TweetMedia {
	mediaKey: string;
	type: TweetMediaType;
	url?: string;
	previewImageUrl?: string;
	altText?: string;
	width?: number;
	height?: number;
}

export interface TweetPayload {
	id: string;
	text: string;
	authorId?: string;
	authorUsername?: string;
	authorName?: string;
	authorAvatarUrl?: string;
	media?: TweetMedia[];
	raw: unknown;
}

export interface TweetSourceProvider {
	getTweetByUrlOrId(input: string): Promise<TweetPayload>;
}

export interface FetchHeadersLike {
	get(name: string): string | null;
}

export interface FetchResponseLike {
	ok: boolean;
	status: number;
	headers: FetchHeadersLike;
	json(): Promise<unknown>;
	text(): Promise<string>;
}

export interface FetchRequestInitLike {
	method?: string;
	headers?: Record<string, string>;
	signal?: AbortSignal;
}

export type FetchLike = (input: string, init?: FetchRequestInitLike) => Promise<FetchResponseLike>;

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

function jitterDelay(baseMs: number, randomFn: () => number): number {
	const jitter = Math.floor(randomFn() * 40);
	return baseMs + jitter;
}

async function defaultSleep(ms: number): Promise<void> {
	await new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
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

function firstNonEmptyString(values: unknown[]): string | undefined {
	for (const value of values) {
		const text = toNonEmptyString(value);
		if (text) {
			return text;
		}
	}
	return undefined;
}

function toPositiveNumber(value: unknown): number | undefined {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
		return undefined;
	}
	return value;
}

function toTweetMediaType(value: unknown): TweetMediaType | undefined {
	const candidate = toNonEmptyString(value);
	if (!candidate) {
		return undefined;
	}
	if (candidate === "photo" || candidate === "video" || candidate === "animated_gif") {
		return candidate;
	}
	return undefined;
}

interface ProviderProblemDetails {
	message?: string;
	type?: string;
}

function readProviderProblemDetails(payload: unknown): ProviderProblemDetails {
	if (!isRecord(payload)) {
		return {};
	}

	const topLevelMessage = firstNonEmptyString([payload.detail, payload.message, payload.title, payload.error]);
	const topLevelType = toNonEmptyString(payload.type);
	const errors = Array.isArray(payload.errors) ? payload.errors : undefined;
	if (!errors || errors.length === 0) {
		return {
			message: topLevelMessage,
			type: topLevelType,
		};
	}

	const firstProblem = errors.find((entry) => isRecord(entry));
	if (!firstProblem) {
		return {
			message: topLevelMessage,
			type: topLevelType,
		};
	}

	return {
		message: firstNonEmptyString([firstProblem.detail, firstProblem.message, firstProblem.title, topLevelMessage]),
		type: toNonEmptyString(firstProblem.type) ?? topLevelType,
	};
}

function readProviderProblemDetailsFromText(bodyText: string): ProviderProblemDetails {
	const trimmed = bodyText.trim();
	if (trimmed.length === 0) {
		return {};
	}

	try {
		return readProviderProblemDetails(JSON.parse(trimmed));
	} catch {
		return {
			message: trimmed,
		};
	}
}

function mapProviderProblemTypeToCode(problemType?: string): XProviderErrorCode | undefined {
	if (!problemType) {
		return undefined;
	}
	const normalized = problemType.toLowerCase();
	if (normalized.includes("resource-not-found") || normalized.includes("not-found")) {
		return "NOT_FOUND";
	}
	if (normalized.includes("rate-limit") || normalized.includes("usage-capped")) {
		return "RATE_LIMITED";
	}
	if (normalized.includes("not-authorized") || normalized.includes("forbidden")) {
		return "FORBIDDEN";
	}
	if (normalized.includes("invalid-request") || normalized.includes("invalid-parameter")) {
		return "INVALID_INPUT";
	}
	return undefined;
}

function defaultErrorMessageForCode(code: XProviderErrorCode, status?: number): string {
	switch (code) {
		case "UNAUTHORIZED":
			return "X API authentication failed.";
		case "FORBIDDEN":
			return "X API access is forbidden for this resource.";
		case "NOT_FOUND":
			return "Tweet was not found.";
		case "RATE_LIMITED":
			return "X API rate limit exceeded.";
		case "INVALID_INPUT":
			return "X API rejected the request.";
		case "CONFIG_ERROR":
			return "X API provider is not configured.";
		case "NETWORK_ERROR":
			return "Network error while calling X API.";
		default:
			return status ? `X API request failed with status ${status}.` : "X API returned an unexpected response.";
	}
}

function toXProviderError(status: number, bodyText: string): XProviderError {
	const problem = readProviderProblemDetailsFromText(bodyText);
	const inferredCode = mapProviderProblemTypeToCode(problem.type);
	const providerMessage = problem.message;

	if (status === 401) {
		return new XProviderError({
			code: "UNAUTHORIZED",
			message: providerMessage ?? defaultErrorMessageForCode("UNAUTHORIZED"),
			status,
			retryable: false,
		});
	}
	if (status === 403) {
		return new XProviderError({
			code: "FORBIDDEN",
			message: providerMessage ?? defaultErrorMessageForCode("FORBIDDEN"),
			status,
			retryable: false,
		});
	}
	if (status === 404) {
		return new XProviderError({
			code: "NOT_FOUND",
			message: providerMessage ?? defaultErrorMessageForCode("NOT_FOUND"),
			status,
			retryable: false,
		});
	}
	if (status === 429) {
		return new XProviderError({
			code: "RATE_LIMITED",
			message: providerMessage ?? defaultErrorMessageForCode("RATE_LIMITED"),
			status,
			retryable: true,
		});
	}

	if (status === 400 || status === 422) {
		const code = inferredCode ?? "INVALID_INPUT";
		return new XProviderError({
			code,
			message: providerMessage ?? defaultErrorMessageForCode(code, status),
			status,
			retryable: code === "RATE_LIMITED",
		});
	}

	if (inferredCode) {
		return new XProviderError({
			code: inferredCode,
			message: providerMessage ?? defaultErrorMessageForCode(inferredCode, status),
			status,
			retryable: inferredCode === "RATE_LIMITED" || status >= 500,
		});
	}

	return new XProviderError({
		code: "UPSTREAM_ERROR",
		message: providerMessage ?? defaultErrorMessageForCode("UPSTREAM_ERROR", status),
		status,
		retryable: status >= 500,
	});
}

function toXProviderErrorFromPayload(responseBody: unknown, fallbackMessage: string): XProviderError {
	const problem = readProviderProblemDetails(responseBody);
	const code = mapProviderProblemTypeToCode(problem.type) ?? "UPSTREAM_ERROR";
	return new XProviderError({
		code,
		message: problem.message ?? fallbackMessage,
		retryable: code === "RATE_LIMITED",
	});
}

function readTweetMedia({
	data,
	includes,
}: {
	data: Record<string, unknown>;
	includes: unknown;
}): TweetMedia[] | undefined {
	const attachments = isRecord(data.attachments) ? data.attachments : undefined;
	const mediaKeysRaw = attachments ? attachments.media_keys : undefined;
	if (!Array.isArray(mediaKeysRaw) || mediaKeysRaw.length === 0) {
		return undefined;
	}

	const mediaKeys = mediaKeysRaw
		.map((key) => (typeof key === "string" ? key.trim() : ""))
		.filter((key) => key.length > 0);
	if (mediaKeys.length === 0 || !isRecord(includes) || !Array.isArray(includes.media)) {
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
	return ordered.length > 0 ? ordered : undefined;
}

function readTweetPayload(responseBody: unknown): TweetPayload {
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

	const id = data.id;
	const text = data.text;
	const authorId = data.author_id;
	const includes = (responseBody as { includes?: unknown }).includes;
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
		throw toXProviderErrorFromPayload(responseBody, "X API payload is missing required tweet fields.");
	}

	const media = readTweetMedia({
		data,
		includes,
	});

	return {
		id,
		text,
		authorId: typeof authorId === "string" && authorId.length > 0 ? authorId : undefined,
		authorUsername: typeof authorUsername === "string" && authorUsername.length > 0 ? authorUsername : undefined,
		authorName: typeof authorName === "string" && authorName.length > 0 ? authorName : undefined,
		authorAvatarUrl: typeof authorAvatarUrl === "string" && authorAvatarUrl.length > 0 ? authorAvatarUrl : undefined,
		media,
		raw: responseBody,
	};
}

export class XApiV2Client implements TweetSourceProvider {
	private readonly config: XApiConfig;
	private readonly fetchFn: FetchLike;
	private readonly sleepFn: (ms: number) => Promise<void>;
	private readonly randomFn: () => number;

	constructor({
		config = readXApiConfigFromEnv(),
		fetchFn,
		sleepFn = defaultSleep,
		randomFn = Math.random,
	}: {
		config?: XApiConfig;
		fetchFn?: FetchLike;
		sleepFn?: (ms: number) => Promise<void>;
		randomFn?: () => number;
	} = {}) {
		this.config = config;
		this.fetchFn = fetchFn ?? (fetch as unknown as FetchLike);
		this.sleepFn = sleepFn;
		this.randomFn = randomFn;
	}

	async getTweetByUrlOrId(input: string): Promise<TweetPayload> {
		const tweetId = parseTweetId(input);
		const url = new URL(`https://api.x.com/2/tweets/${tweetId}`);
		url.searchParams.set("expansions", "author_id,attachments.media_keys");
		url.searchParams.set("tweet.fields", "author_id,attachments");
		url.searchParams.set("user.fields", "id,username,name,profile_image_url");
		url.searchParams.set("media.fields", "type,url,preview_image_url,alt_text,width,height");

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
					return readTweetPayload(await response.json());
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
}
