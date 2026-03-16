import assert from "node:assert/strict";
import test from "node:test";

import {
	CreateCreatorFollowInputSchema,
	FollowingFeedResponseSchema,
	FollowSuggestionsResponseSchema,
} from "../src/index.js";

test("creator follow input requires subjectTag for subject scope", () => {
	const result = CreateCreatorFollowInputSchema.safeParse({
		kind: "creator",
		creatorUsername: "ctatedev",
		scope: "subject",
	});

	assert.equal(result.success, false);
	assert.match(result.error.issues[0]?.message ?? "", /subjectTag is required/i);
});

test("creator follow input rejects subjectTag for all-feed scope", () => {
	const result = CreateCreatorFollowInputSchema.safeParse({
		kind: "creator",
		creatorUsername: "ctatedev",
		scope: "all_feed",
		subjectTag: "Growth",
	});

	assert.equal(result.success, false);
	assert.match(result.error.issues[0]?.message ?? "", /must be omitted/i);
});

test("following feed response parses bookmark matches", () => {
	const parsed = FollowingFeedResponseSchema.parse({
		bookmarks: [
			{
				id: "bookmark_1",
				userId: "user_1",
				tweetId: "tweet_1",
				tweetText: "Ship more often.",
				tweetUrlOrId: "https://x.com/ctatedev/status/1",
				authorUsername: "ctatedev",
				tags: ["Shipping"],
				createdAt: 100,
				updatedAt: 200,
				matches: [
					{
						type: "creator_subject",
						creatorUsername: "ctatedev",
						subjectTag: "Shipping",
					},
				],
			},
		],
	});

	assert.equal(parsed.bookmarks.length, 1);
	assert.equal(parsed.bookmarks[0]?.matches[0]?.type, "creator_subject");
});

test("follow suggestions response parses counts and recency", () => {
	const parsed = FollowSuggestionsResponseSchema.parse({
		subjectTag: "Growth",
		suggestions: [
			{
				creatorUsername: "growthgal",
				creatorName: "Riley West",
				subjectTag: "Growth",
				bookmarkCount: 3,
				latestBookmarkAt: 200,
			},
		],
	});

	assert.equal(parsed.subjectTag, "Growth");
	assert.equal(parsed.suggestions[0]?.bookmarkCount, 3);
});
