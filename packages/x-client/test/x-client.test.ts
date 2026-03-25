import assert from "node:assert/strict";
import test from "node:test";

import {
	type FetchLike,
	type FetchResponseLike,
	readXApiConfigFromEnv,
	XApiV2Client,
	XProviderError,
} from "../src/index.js";

function responseFrom({ status, body }: { status: number; body: unknown }): FetchResponseLike {
	return {
		ok: status >= 200 && status < 300,
		status,
		headers: {
			get: () => null,
		},
		async json() {
			return body;
		},
		async text() {
			return typeof body === "string" ? body : JSON.stringify(body);
		},
	};
}

test("readXApiConfigFromEnv validates required keys", () => {
	assert.throws(
		() => readXApiConfigFromEnv({ X_API_KEY: "key", X_API_SECRET: "secret" }),
		(error: unknown) => error instanceof XProviderError && error.code === "CONFIG_ERROR",
	);
});

test("XApiV2Client returns tweet payload on success", async () => {
	let calledUrl = "";
	const fetchFn: FetchLike = async (input) => {
		calledUrl = input;
		return responseFrom({
			status: 200,
			body: {
				data: {
					id: "123",
					text: "Hello from X",
					author_id: "user_1",
					created_at: "2026-03-20T10:00:00.000Z",
					conversation_id: "123",
					attachments: {
						media_keys: ["3_photo_1"],
					},
					public_metrics: {
						reply_count: 12,
						retweet_count: 33,
						like_count: 240,
						quote_count: 4,
						bookmark_count: 7,
						impression_count: 1100,
					},
				},
				includes: {
					users: [
						{
							id: "user_1",
							username: "moe",
							name: "Moe",
							profile_image_url: "https://example.com/avatar.jpg",
						},
					],
					media: [
						{
							media_key: "3_photo_1",
							type: "photo",
							url: "https://example.com/photo.jpg",
							alt_text: "Example photo",
							width: 1200,
							height: 675,
						},
					],
				},
			},
		});
	};

	const client = new XApiV2Client({
		config: {
			apiKey: "key",
			apiSecret: "secret",
			bearerToken: "bearer",
			timeoutMs: 500,
			retryCount: 0,
			retryBaseDelayMs: 1,
		},
		fetchFn,
	});

	const tweet = await client.getTweetByUrlOrId("https://x.com/moe/status/123");
	assert.equal(tweet.id, "123");
	assert.equal(tweet.text, "Hello from X");
	assert.equal(tweet.authorId, "user_1");
	assert.equal(tweet.authorUsername, "moe");
	assert.equal(tweet.authorName, "Moe");
	assert.equal(tweet.authorAvatarUrl, "https://example.com/avatar.jpg");
	assert.equal(tweet.createdAt, "2026-03-20T10:00:00.000Z");
	assert.equal(tweet.conversationId, "123");

	assert.deepEqual(tweet.media, [
		{
			mediaKey: "3_photo_1",
			type: "photo",
			url: "https://example.com/photo.jpg",
			altText: "Example photo",
			width: 1200,
			height: 675,
		},
	]);
	assert.deepEqual(tweet.publicMetrics, {
		replyCount: 12,
		repostCount: 33,
		likeCount: 240,
		quoteCount: 4,
		bookmarkCount: 7,
		impressionCount: 1100,
	});

	const requestUrl = new URL(calledUrl);
	assert.equal(requestUrl.searchParams.get("expansions"), "author_id,attachments.media_keys");
	assert.equal(
		requestUrl.searchParams.get("tweet.fields"),
		"author_id,attachments,public_metrics,created_at,conversation_id,referenced_tweets",
	);
	assert.equal(requestUrl.searchParams.get("media.fields"), "type,url,preview_image_url,alt_text,width,height");
});

test("XApiV2Client returns the full ordered thread from the author timeline", async () => {
	const requestedUrls: string[] = [];
	const fetchFn: FetchLike = async (input) => {
		requestedUrls.push(input);
		const url = new URL(input);
		if (url.pathname === "/2/tweets/124") {
			return responseFrom({
				status: 200,
				body: {
					data: {
						id: "124",
						text: "Second post",
						author_id: "user_1",
						created_at: "2026-03-20T10:01:00.000Z",
						conversation_id: "123",
						referenced_tweets: [{ type: "replied_to", id: "123" }],
					},
					includes: {
						users: [
							{
								id: "user_1",
								username: "moe",
								name: "Moe",
							},
						],
					},
				},
			});
		}

		if (url.searchParams.get("pagination_token") === "page_2") {
			return responseFrom({
				status: 200,
				body: {
					data: [
						{
							id: "123",
							text: "Root post",
							author_id: "user_1",
							created_at: "2026-03-20T10:00:00.000Z",
							conversation_id: "123",
						},
					],
					includes: {
						users: [
							{
								id: "user_1",
								username: "moe",
								name: "Moe",
							},
						],
					},
					meta: {
						result_count: 1,
					},
				},
			});
		}

		return responseFrom({
			status: 200,
			body: {
				data: [
					{
						id: "130",
						text: "Unrelated newer post",
						author_id: "user_1",
						created_at: "2026-03-20T10:10:00.000Z",
						conversation_id: "130",
					},
					{
						id: "125",
						text: "Third post",
						author_id: "user_1",
						created_at: "2026-03-20T10:02:00.000Z",
						conversation_id: "123",
						referenced_tweets: [{ type: "replied_to", id: "124" }],
					},
					{
						id: "124",
						text: "Second post",
						author_id: "user_1",
						created_at: "2026-03-20T10:01:00.000Z",
						conversation_id: "123",
						referenced_tweets: [{ type: "replied_to", id: "123" }],
					},
				],
				includes: {
					users: [
						{
							id: "user_1",
							username: "moe",
							name: "Moe",
						},
					],
				},
				meta: {
					result_count: 3,
					next_token: "page_2",
				},
			},
		});
	};

	const client = new XApiV2Client({
		config: {
			apiKey: "key",
			apiSecret: "secret",
			bearerToken: "bearer",
			timeoutMs: 500,
			retryCount: 0,
			retryBaseDelayMs: 1,
		},
		fetchFn,
	});

	const thread = await client.getThreadByUrlOrId("124");
	assert.equal(thread.rootTweetId, "123");
	assert.deepEqual(
		thread.tweets.map((tweet) => tweet.id),
		["123", "124", "125"],
	);
	assert.equal(thread.tweets[1]?.inReplyToTweetId, "123");
	assert.equal(thread.tweets[2]?.inReplyToTweetId, "124");

	const firstTimelineUrl = new URL(requestedUrls[1] ?? "");
	assert.equal(firstTimelineUrl.pathname, "/2/users/user_1/tweets");
	assert.equal(firstTimelineUrl.searchParams.get("max_results"), "100");
	assert.equal(firstTimelineUrl.searchParams.get("pagination_token"), null);

	const secondTimelineUrl = new URL(requestedUrls[2] ?? "");
	assert.equal(secondTimelineUrl.pathname, "/2/users/user_1/tweets");
	assert.equal(secondTimelineUrl.searchParams.get("pagination_token"), "page_2");
});

test("XApiV2Client maps 404 to NOT_FOUND", async () => {
	const fetchFn: FetchLike = async () => responseFrom({ status: 404, body: "not found" });
	const client = new XApiV2Client({
		config: {
			apiKey: "key",
			apiSecret: "secret",
			bearerToken: "bearer",
			timeoutMs: 500,
			retryCount: 0,
			retryBaseDelayMs: 1,
		},
		fetchFn,
	});

	await assert.rejects(client.getTweetByUrlOrId("123"), (error: unknown) => {
		return error instanceof XProviderError && error.code === "NOT_FOUND";
	});
});

test("XApiV2Client maps 403 to FORBIDDEN", async () => {
	const fetchFn: FetchLike = async () => responseFrom({ status: 403, body: "private tweet" });
	const client = new XApiV2Client({
		config: {
			apiKey: "key",
			apiSecret: "secret",
			bearerToken: "bearer",
			timeoutMs: 500,
			retryCount: 0,
			retryBaseDelayMs: 1,
		},
		fetchFn,
	});

	await assert.rejects(client.getTweetByUrlOrId("123"), (error: unknown) => {
		return error instanceof XProviderError && error.code === "FORBIDDEN";
	});
});

test("XApiV2Client maps 401 to UNAUTHORIZED", async () => {
	const fetchFn: FetchLike = async () => responseFrom({ status: 401, body: "bad token" });
	const client = new XApiV2Client({
		config: {
			apiKey: "key",
			apiSecret: "secret",
			bearerToken: "bearer",
			timeoutMs: 500,
			retryCount: 0,
			retryBaseDelayMs: 1,
		},
		fetchFn,
	});

	await assert.rejects(client.getTweetByUrlOrId("123"), (error: unknown) => {
		return error instanceof XProviderError && error.code === "UNAUTHORIZED";
	});
});

test("XApiV2Client maps 400 invalid-request payload to INVALID_INPUT", async () => {
	const fetchFn: FetchLike = async () =>
		responseFrom({
			status: 400,
			body: {
				errors: [
					{
						title: "Invalid Request",
						detail: "One or more request parameters are invalid.",
						type: "https://api.x.com/2/problems/invalid-request",
					},
				],
			},
		});

	const client = new XApiV2Client({
		config: {
			apiKey: "key",
			apiSecret: "secret",
			bearerToken: "bearer",
			timeoutMs: 500,
			retryCount: 0,
			retryBaseDelayMs: 1,
		},
		fetchFn,
	});

	await assert.rejects(client.getTweetByUrlOrId("123"), (error: unknown) => {
		return (
			error instanceof XProviderError &&
			error.code === "INVALID_INPUT" &&
			error.message.includes("request parameters are invalid")
		);
	});
});

test("XApiV2Client maps 200 payload errors to specific provider codes", async () => {
	const fetchFn: FetchLike = async () =>
		responseFrom({
			status: 200,
			body: {
				errors: [
					{
						title: "Not Found Error",
						detail: "Could not find tweet with id: [123].",
						type: "https://api.x.com/2/problems/resource-not-found",
					},
				],
			},
		});

	const client = new XApiV2Client({
		config: {
			apiKey: "key",
			apiSecret: "secret",
			bearerToken: "bearer",
			timeoutMs: 500,
			retryCount: 0,
			retryBaseDelayMs: 1,
		},
		fetchFn,
	});

	await assert.rejects(client.getTweetByUrlOrId("123"), (error: unknown) => {
		return error instanceof XProviderError && error.code === "NOT_FOUND";
	});
});

test("XApiV2Client parses video preview and keeps media key order", async () => {
	const fetchFn: FetchLike = async () =>
		responseFrom({
			status: 200,
			body: {
				data: {
					id: "123",
					text: "Video + photo post",
					author_id: "user_1",
					attachments: {
						media_keys: ["7_video", "3_photo"],
					},
				},
				includes: {
					users: [
						{
							id: "user_1",
							username: "moe",
							name: "Moe",
						},
					],
					media: [
						{
							media_key: "3_photo",
							type: "photo",
							url: "https://example.com/second.jpg",
						},
						{
							media_key: "7_video",
							type: "video",
							preview_image_url: "https://example.com/video-preview.jpg",
						},
					],
				},
			},
		});

	const client = new XApiV2Client({
		config: {
			apiKey: "key",
			apiSecret: "secret",
			bearerToken: "bearer",
			timeoutMs: 500,
			retryCount: 0,
			retryBaseDelayMs: 1,
		},
		fetchFn,
	});

	const tweet = await client.getTweetByUrlOrId("123");
	assert.equal(tweet.media?.[0]?.mediaKey, "7_video");
	assert.equal(tweet.media?.[0]?.type, "video");
	assert.equal(tweet.media?.[0]?.previewImageUrl, "https://example.com/video-preview.jpg");
	assert.equal(tweet.media?.[1]?.mediaKey, "3_photo");
});

test("XApiV2Client skips missing media mappings without throwing", async () => {
	const warnings: unknown[] = [];
	const fetchFn: FetchLike = async () =>
		responseFrom({
			status: 200,
			body: {
				data: {
					id: "123",
					text: "Missing media include test",
					attachments: {
						media_keys: ["missing_1", "missing_2"],
					},
				},
				includes: {
					media: [
						{
							media_key: "other_key",
							type: "photo",
							url: "https://example.com/other.jpg",
						},
					],
				},
			},
		});

	const client = new XApiV2Client({
		config: {
			apiKey: "key",
			apiSecret: "secret",
			bearerToken: "bearer",
			timeoutMs: 500,
			retryCount: 0,
			retryBaseDelayMs: 1,
		},
		fetchFn,
		warningReporter: (event) => {
			warnings.push(event);
		},
	});

	const tweet = await client.getTweetByUrlOrId("123");
	assert.equal(tweet.media, undefined);
	assert.deepEqual(warnings, [
		{
			code: "MEDIA_KEYS_UNRESOLVED",
			tweetId: "123",
			mediaKeys: ["missing_1", "missing_2"],
			includesMediaCount: 1,
		},
	]);
});

test("XApiV2Client reports warning when media keys exist but includes.media is missing", async () => {
	const warnings: unknown[] = [];
	const fetchFn: FetchLike = async () =>
		responseFrom({
			status: 200,
			body: {
				data: {
					id: "123",
					text: "Missing includes media",
					attachments: {
						media_keys: ["13_video_1"],
					},
				},
				includes: {
					users: [],
				},
			},
		});

	const client = new XApiV2Client({
		config: {
			apiKey: "key",
			apiSecret: "secret",
			bearerToken: "bearer",
			timeoutMs: 500,
			retryCount: 0,
			retryBaseDelayMs: 1,
		},
		fetchFn,
		warningReporter: (event) => {
			warnings.push(event);
		},
	});

	const tweet = await client.getTweetByUrlOrId("123");
	assert.equal(tweet.media, undefined);
	assert.deepEqual(warnings, [
		{
			code: "MEDIA_METADATA_MISSING",
			tweetId: "123",
			mediaKeys: ["13_video_1"],
			includesMediaCount: 0,
		},
	]);
});

test("XApiV2Client retries 429 and fails after retry budget", async () => {
	let attempts = 0;
	const fetchFn: FetchLike = async () => {
		attempts += 1;
		return responseFrom({ status: 429, body: "rate limited" });
	};

	const client = new XApiV2Client({
		config: {
			apiKey: "key",
			apiSecret: "secret",
			bearerToken: "bearer",
			timeoutMs: 500,
			retryCount: 2,
			retryBaseDelayMs: 1,
		},
		fetchFn,
		sleepFn: async () => {},
		randomFn: () => 0,
	});

	await assert.rejects(client.getTweetByUrlOrId("123"), (error: unknown) => {
		return error instanceof XProviderError && error.code === "RATE_LIMITED";
	});
	assert.equal(attempts, 3);
});
