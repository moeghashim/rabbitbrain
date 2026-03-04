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
	const fetchFn: FetchLike = async () =>
		responseFrom({
			status: 200,
			body: {
				data: {
					id: "123",
					text: "Hello from X",
					author_id: "user_1",
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

	const tweet = await client.getTweetByUrlOrId("https://x.com/moe/status/123");
	assert.equal(tweet.id, "123");
	assert.equal(tweet.text, "Hello from X");
	assert.equal(tweet.authorId, "user_1");
	assert.equal(tweet.authorUsername, "moe");
	assert.equal(tweet.authorName, "Moe");
	assert.equal(tweet.authorAvatarUrl, "https://example.com/avatar.jpg");
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
