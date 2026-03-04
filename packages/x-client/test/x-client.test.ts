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
					attachments: {
						media_keys: ["3_photo_1"],
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

	const requestUrl = new URL(calledUrl);
	assert.equal(requestUrl.searchParams.get("expansions"), "author_id,attachments.media_keys");
	assert.equal(requestUrl.searchParams.get("tweet.fields"), "author_id,attachments");
	assert.equal(requestUrl.searchParams.get("media.fields"), "type,url,preview_image_url,alt_text,width,height");
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
	});

	const tweet = await client.getTweetByUrlOrId("123");
	assert.equal(tweet.media, undefined);
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
