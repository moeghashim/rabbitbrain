import assert from "node:assert/strict";
import test from "node:test";

import type {
	CreatorFollow,
	DeleteFollowResult,
	FollowSuggestionsResponse,
	FollowSummary,
	FollowingFeedResponse,
	SubjectFollow,
} from "@pi-starter/contracts";

import {
	handleFollowSuggestionsGet,
} from "../app/api/me/follows/suggestions/route.js";
import {
	handleFollowsDelete,
	handleFollowsGet,
	handleFollowsPost,
} from "../app/api/me/follows/route.js";
import {
	handleFollowingFeedGet,
} from "../app/api/me/following-feed/route.js";

function createCreatorFollow(): CreatorFollow {
	return {
		id: "creator_follow_1",
		userId: "user_1",
		creatorUsername: "ctatedev",
		creatorName: "Chris Tate",
		scope: "all_feed",
		createdAt: 100,
		updatedAt: 200,
	};
}

function createSubjectFollow(): SubjectFollow {
	return {
		id: "subject_follow_1",
		userId: "user_1",
		subjectTag: "Shipping",
		createdAt: 100,
		updatedAt: 200,
	};
}

function createDependencies() {
	return {
		validateStartupEnvIfNeeded: () => {},
		getServerAuthSession: async () => ({
			user: {
				id: "user_1",
				email: "user@example.com",
				name: "User",
			},
		}),
		listFollowsForSession: async () =>
			({
				creatorFollows: [createCreatorFollow()],
				subjectFollows: [createSubjectFollow()],
			}) as FollowSummary,
		createCreatorFollowForSession: async () => createCreatorFollow(),
		createSubjectFollowForSession: async () => createSubjectFollow(),
		deleteCreatorFollowForSession: async () =>
			({
				followId: "creator_follow_1",
			}) as DeleteFollowResult,
		deleteSubjectFollowForSession: async () =>
			({
				followId: "subject_follow_1",
			}) as DeleteFollowResult,
		listFollowSuggestionsForSession: async () =>
			({
				subjectTag: "Shipping",
				suggestions: [
					{
						creatorUsername: "opslead",
						creatorName: "Morgan Lee",
						subjectTag: "Shipping",
						bookmarkCount: 2,
						latestBookmarkAt: 300,
					},
				],
			}) as FollowSuggestionsResponse,
		listFollowingFeedForSession: async () =>
			({
				bookmarks: [
					{
						id: "bookmark_1",
						userId: "user_1",
						tweetId: "tweet_1",
						tweetText: "Ship often.",
						tweetUrlOrId: "https://x.com/ctatedev/status/1",
						authorUsername: "ctatedev",
						tags: ["Shipping"],
						createdAt: 100,
						updatedAt: 200,
						matches: [{ type: "creator_all_feed", creatorUsername: "ctatedev" }],
					},
				],
			}) as FollowingFeedResponse,
		reportServerError: () => {},
	};
}

test("GET /api/me/follows returns follows summary", async () => {
	const response = await handleFollowsGet(createDependencies());
	assert.equal(response.status, 200);
	const payload = (await response.json()) as FollowSummary;
	assert.equal(payload.creatorFollows.length, 1);
	assert.equal(payload.subjectFollows.length, 1);
});

test("POST /api/me/follows creates creator follow", async () => {
	const response = await handleFollowsPost(
		new Request("http://localhost/api/me/follows", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				kind: "creator",
				creatorUsername: "ctatedev",
				scope: "all_feed",
			}),
		}),
		createDependencies(),
	);

	assert.equal(response.status, 200);
	const payload = (await response.json()) as CreatorFollow;
	assert.equal(payload.scope, "all_feed");
});

test("DELETE /api/me/follows deletes subject follow", async () => {
	const response = await handleFollowsDelete(
		new Request("http://localhost/api/me/follows", {
			method: "DELETE",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				kind: "subject",
				followId: "subject_follow_1",
			}),
		}),
		createDependencies(),
	);

	assert.equal(response.status, 200);
	const payload = (await response.json()) as DeleteFollowResult;
	assert.equal(payload.followId, "subject_follow_1");
});

test("GET /api/me/follows/suggestions returns subject suggestions", async () => {
	const response = await handleFollowSuggestionsGet(
		new Request("http://localhost/api/me/follows/suggestions?subjectTag=Shipping"),
		{
			validateStartupEnvIfNeeded: createDependencies().validateStartupEnvIfNeeded,
			getServerAuthSession: createDependencies().getServerAuthSession,
			listFollowSuggestionsForSession: createDependencies().listFollowSuggestionsForSession,
			reportServerError: createDependencies().reportServerError,
		},
	);

	assert.equal(response.status, 200);
	const payload = (await response.json()) as FollowSuggestionsResponse;
	assert.equal(payload.suggestions[0]?.creatorUsername, "opslead");
});

test("GET /api/me/following-feed returns matched bookmarks", async () => {
	const response = await handleFollowingFeedGet({
		validateStartupEnvIfNeeded: createDependencies().validateStartupEnvIfNeeded,
		getServerAuthSession: createDependencies().getServerAuthSession,
		listFollowingFeedForSession: createDependencies().listFollowingFeedForSession,
		reportServerError: createDependencies().reportServerError,
	});

	assert.equal(response.status, 200);
	const payload = (await response.json()) as FollowingFeedResponse;
	assert.equal(payload.bookmarks.length, 1);
	assert.equal(payload.bookmarks[0]?.matches[0]?.type, "creator_all_feed");
});

test("GET /api/me/follows returns a JSON error when follow loading fails", async () => {
	const response = await handleFollowsGet({
		...createDependencies(),
		listFollowsForSession: async () => {
			throw new Error("Could not find public function for 'follows:listSummary'");
		},
	});

	assert.equal(response.status, 500);
	assert.deepEqual(await response.json(), {
		error: {
			message: "Could not find public function for 'follows:listSummary'",
		},
	});
});

test("GET /api/me/following-feed returns a JSON error when feed loading fails", async () => {
	const response = await handleFollowingFeedGet({
		...createDependencies(),
		listFollowingFeedForSession: async () => {
			throw new Error("Could not find public function for 'follows:listFollowingFeed'");
		},
	});

	assert.equal(response.status, 500);
	assert.deepEqual(await response.json(), {
		error: {
			message: "Could not find public function for 'follows:listFollowingFeed'",
		},
	});
});
