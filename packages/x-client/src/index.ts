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

export interface TweetPayload {
	id: string;
	text: string;
	authorId?: string;
	authorUsername?: string;
	authorName?: string;
	authorAvatarUrl?: string;
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

function toXProviderError(status: number, bodyText: string): XProviderError {
	if (status === 401) {
		return new XProviderError({
			code: "UNAUTHORIZED",
			message: bodyText || "X API authentication failed.",
			status,
			retryable: false,
		});
	}
	if (status === 403) {
		return new XProviderError({
			code: "FORBIDDEN",
			message: bodyText || "X API access is forbidden for this resource.",
			status,
			retryable: false,
		});
	}
	if (status === 404) {
		return new XProviderError({
			code: "NOT_FOUND",
			message: bodyText || "Tweet was not found.",
			status,
			retryable: false,
		});
	}
	if (status === 429) {
		return new XProviderError({
			code: "RATE_LIMITED",
			message: bodyText || "X API rate limit exceeded.",
			status,
			retryable: true,
		});
	}
	return new XProviderError({
		code: "UPSTREAM_ERROR",
		message: bodyText || `X API request failed with status ${status}.`,
		status,
		retryable: status >= 500,
	});
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
	if (typeof data !== "object" || data === null) {
		throw new XProviderError({
			code: "UPSTREAM_ERROR",
			message: "X API payload missing data object.",
			retryable: false,
		});
	}

	const id = (data as { id?: unknown }).id;
	const text = (data as { text?: unknown }).text;
	const authorId = (data as { author_id?: unknown }).author_id;
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
		throw new XProviderError({
			code: "UPSTREAM_ERROR",
			message: "X API payload is missing required tweet fields.",
			retryable: false,
		});
	}

	return {
		id,
		text,
		authorId: typeof authorId === "string" && authorId.length > 0 ? authorId : undefined,
		authorUsername: typeof authorUsername === "string" && authorUsername.length > 0 ? authorUsername : undefined,
		authorName: typeof authorName === "string" && authorName.length > 0 ? authorName : undefined,
		authorAvatarUrl: typeof authorAvatarUrl === "string" && authorAvatarUrl.length > 0 ? authorAvatarUrl : undefined,
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
		url.searchParams.set("expansions", "author_id");
		url.searchParams.set("tweet.fields", "author_id");
		url.searchParams.set("user.fields", "id,username,name,profile_image_url");

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
