import assert from "node:assert/strict";
import test from "node:test";
import type {
	SaveBookmarkInput,
	SavedBookmark,
} from "@pi-starter/contracts";

import {
	handleBookmarksGet,
	handleBookmarksPost,
} from "../app/api/bookmarks/route.js";

function createInput(tags: string[]): SaveBookmarkInput {
	return {
		tweetId: "2028960626685386994",
		tweetText: "Ship small and often.",
		tweetUrlOrId: "https://x.com/ctatedev/status/2028960626685386994",
		authorUsername: "ctatedev",
		authorName: "Chris Tate",
		authorAvatarUrl: "https://pbs.twimg.com/profile_images/example.jpg",
		tags,
	};
}

function createSavedBookmark(input: SaveBookmarkInput, updatedAt: number): SavedBookmark {
	return {
		id: "bookmark_1",
		userId: "user_1",
		...input,
		createdAt: 100,
		updatedAt,
	};
}

test("POST /api/bookmarks saves bookmark for authenticated user", async () => {
	const input = createInput(["infra", "ux"]);
	const response = await handleBookmarksPost(
		new Request("http://localhost/api/bookmarks", {
			method: "POST",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify(input),
		}),
		{
			validateStartupEnvIfNeeded: () => {},
			getServerAuthSession: async () => ({ user: { id: "user_1", email: "user@example.com", name: "User" } }),
			saveBookmarkForSession: async () => createSavedBookmark(input, 200),
			listBookmarksForSession: async () => [],
			reportServerError: () => {},
		},
	);

	assert.equal(response.status, 200);
	const payload = (await response.json()) as SavedBookmark;
	assert.equal(payload.tweetId, input.tweetId);
	assert.deepEqual(payload.tags, input.tags);
});

test("POST /api/bookmarks re-save updates existing bookmark without duplicates", async () => {
	const store = new Map<string, SavedBookmark>();

	const dependencies = {
		validateStartupEnvIfNeeded: () => {},
		getServerAuthSession: async () => ({ user: { id: "user_1", email: "user@example.com", name: "User" } }),
		saveBookmarkForSession: async ({ input }: { input: SaveBookmarkInput }) => {
			const existing = store.get(input.tweetId);
			if (existing) {
				const next = {
					...existing,
					...input,
					updatedAt: existing.updatedAt + 100,
				};
				store.set(input.tweetId, next);
				return next;
			}

			const created = createSavedBookmark(input, 200);
			store.set(input.tweetId, created);
			return created;
		},
		listBookmarksForSession: async () => Array.from(store.values()),
		reportServerError: () => {},
	};

	const firstInput = createInput(["infra"]);
	const secondInput = createInput(["reliability", "shipping"]);

	await handleBookmarksPost(
		new Request("http://localhost/api/bookmarks", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(firstInput),
		}),
		dependencies,
	);

	await handleBookmarksPost(
		new Request("http://localhost/api/bookmarks", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(secondInput),
		}),
		dependencies,
	);

	const listResponse = await handleBookmarksGet(dependencies);
	assert.equal(listResponse.status, 200);
	const payload = (await listResponse.json()) as { bookmarks: SavedBookmark[] };
	assert.equal(payload.bookmarks.length, 1);
	assert.deepEqual(payload.bookmarks[0]?.tags, secondInput.tags);
});

test("GET /api/bookmarks returns current user bookmarks", async () => {
	const saved = createSavedBookmark(createInput(["api"]), 300);
	const response = await handleBookmarksGet({
		validateStartupEnvIfNeeded: () => {},
		getServerAuthSession: async () => ({ user: { id: "user_1", email: "user@example.com", name: "User" } }),
		saveBookmarkForSession: async () => saved,
		listBookmarksForSession: async () => [saved],
		reportServerError: () => {},
	});

	assert.equal(response.status, 200);
	const payload = (await response.json()) as { bookmarks: SavedBookmark[] };
	assert.equal(payload.bookmarks.length, 1);
	assert.equal(payload.bookmarks[0]?.tweetId, saved.tweetId);
});

test("POST /api/bookmarks returns 401 when unauthenticated", async () => {
	const input = createInput(["infra"]);
	const response = await handleBookmarksPost(
		new Request("http://localhost/api/bookmarks", {
			method: "POST",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify(input),
		}),
		{
			validateStartupEnvIfNeeded: () => {},
			getServerAuthSession: async () => null,
			saveBookmarkForSession: async () => createSavedBookmark(input, 200),
			listBookmarksForSession: async () => [],
			reportServerError: () => {},
		},
	);

	assert.equal(response.status, 401);
});

test("POST /api/bookmarks returns 400 when tags are invalid", async () => {
	const response = await handleBookmarksPost(
		new Request("http://localhost/api/bookmarks", {
			method: "POST",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({
				tweetId: "1",
				tweetText: "Tweet",
				tweetUrlOrId: "https://x.com/user/status/1",
				authorUsername: "user",
				tags: [],
			}),
		}),
		{
			validateStartupEnvIfNeeded: () => {},
			getServerAuthSession: async () => ({ user: { id: "user_1", email: "user@example.com", name: "User" } }),
			saveBookmarkForSession: async () => createSavedBookmark(createInput(["fallback"]), 200),
			listBookmarksForSession: async () => [],
			reportServerError: () => {},
		},
	);

	assert.equal(response.status, 400);
});
