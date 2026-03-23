import assert from "node:assert/strict";
import test from "node:test";

import { type FetchLike, type FetchResponseLike, XApiV2Client } from "../src/index.js";

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

test("XApiV2Client resolves a user by username", async () => {
	let calledUrl = "";
	const fetchFn: FetchLike = async (input) => {
		calledUrl = input;
		return responseFrom({
			status: 200,
			body: {
				data: {
					id: "user_1",
					username: "ctatedev",
					name: "Chris Tate",
					profile_image_url: "https://example.com/avatar.jpg",
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

	const user = await client.getUserByUsername("@ctatedev");
	assert.equal(user.id, "user_1");
	assert.equal(user.username, "ctatedev");
	assert.equal(user.name, "Chris Tate");
	assert.equal(user.avatarUrl, "https://example.com/avatar.jpg");

	const requestUrl = new URL(calledUrl);
	assert.equal(requestUrl.pathname, "/2/users/by/username/ctatedev");
	assert.equal(requestUrl.searchParams.get("user.fields"), "id,username,name,profile_image_url");
});

test("XApiV2Client returns latest posts for a username", async () => {
	const requestedUrls: string[] = [];
	const fetchFn: FetchLike = async (input) => {
		requestedUrls.push(input);
		const url = new URL(input);
		if (url.pathname === "/2/users/by/username/ctatedev") {
			return responseFrom({
				status: 200,
				body: {
					data: {
						id: "user_1",
						username: "ctatedev",
						name: "Chris Tate",
					},
				},
			});
		}

		return responseFrom({
			status: 200,
			body: {
				data: [
					{
						id: "201",
						text: "Newest post",
						author_id: "user_1",
						created_at: "2026-03-22T10:00:00.000Z",
					},
					{
						id: "200",
						text: "Older post",
						author_id: "user_1",
						created_at: "2026-03-21T10:00:00.000Z",
					},
				],
				includes: {
					users: [
						{
							id: "user_1",
							username: "ctatedev",
							name: "Chris Tate",
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

	const posts = await client.getLatestPostsByUsername("ctatedev", 20);
	assert.equal(posts.length, 2);
	assert.equal(posts[0]?.authorUsername, "ctatedev");
	assert.equal(posts[1]?.id, "200");

	const requestUrl = new URL(requestedUrls[1] ?? "");
	assert.equal(requestUrl.pathname, "/2/users/user_1/tweets");
	assert.equal(requestUrl.searchParams.get("max_results"), "20");
});

test("XApiV2Client returns latest posts for a known user id", async () => {
	let calledUrl = "";
	const fetchFn: FetchLike = async (input) => {
		calledUrl = input;
		return responseFrom({
			status: 200,
			body: {
				data: [
					{
						id: "201",
						text: "Newest post",
						author_id: "user_1",
						created_at: "2026-03-22T10:00:00.000Z",
					},
				],
				includes: {
					users: [
						{
							id: "user_1",
							username: "ctatedev",
							name: "Chris Tate",
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

	const posts = await client.getLatestPostsByUserId("user_1", 20);
	assert.equal(posts.length, 1);
	assert.equal(posts[0]?.authorUsername, "ctatedev");

	const requestUrl = new URL(calledUrl);
	assert.equal(requestUrl.pathname, "/2/users/user_1/tweets");
	assert.equal(requestUrl.searchParams.get("max_results"), "20");
});
