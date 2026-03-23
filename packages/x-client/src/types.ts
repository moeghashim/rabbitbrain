import type { TweetPublicMetrics } from "./tweet-public-metrics.js";

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
	createdAt?: string;
	conversationId?: string;
	inReplyToTweetId?: string;
	media?: TweetMedia[];
	publicMetrics?: TweetPublicMetrics;
	raw: unknown;
}

export interface XUserPayload {
	id: string;
	username: string;
	name?: string;
	avatarUrl?: string;
	raw: unknown;
}

export type ThreadTweetPayload = TweetPayload;

export interface ThreadPayload {
	rootTweetId: string;
	tweets: ThreadTweetPayload[];
}

export type XProviderWarningCode = "MEDIA_METADATA_MISSING" | "MEDIA_KEYS_UNRESOLVED";

export interface XProviderWarningEvent {
	code: XProviderWarningCode;
	tweetId?: string;
	mediaKeys: string[];
	includesMediaCount: number;
}

export type XProviderWarningReporter = (event: XProviderWarningEvent) => void;

export interface TweetSourceProvider {
	getTweetByUrlOrId(input: string): Promise<TweetPayload>;
	getThreadByUrlOrId(input: string): Promise<ThreadPayload>;
}

export interface AccountTimelineProvider extends TweetSourceProvider {
	getUserByUsername(username: string): Promise<XUserPayload>;
	getLatestPostsByUserId(userId: string, limit: number): Promise<TweetPayload[]>;
	getLatestPostsByUsername(username: string, limit: number): Promise<TweetPayload[]>;
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
