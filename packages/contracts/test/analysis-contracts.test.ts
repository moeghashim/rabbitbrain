import assert from "node:assert/strict";
import test from "node:test";
import { parseBookmarkTags, validateBookmarkTags } from "../src/bookmark-tags.js";
import {
	type AnalyzeTweetInput,
	AnalyzeTweetInputSchema,
	type AnalyzeTweetResult,
	AnalyzeTweetResultSchema,
	type DeleteBookmarkInput,
	DeleteBookmarkInputSchema,
	type DeleteBookmarkResult,
	DeleteBookmarkResultSchema,
	type SaveBookmarkInput,
	SaveBookmarkInputSchema,
	type SavedAnalysis,
	SavedAnalysisSchema,
	type SavedBookmark,
	SavedBookmarkSchema,
	type UpdateBookmarkTagsInput,
	UpdateBookmarkTagsInputSchema,
} from "../src/index.js";

function sampleAnalysisResult(): AnalyzeTweetResult {
	return {
		topic: "Model deployment",
		summary: "A post describing deployment confidence.",
		intent: "Share a successful engineering update.",
		novelConcepts: [
			{ name: "Progressive rollout", whyItMattersInTweet: "Reduces blast radius." },
			{ name: "Observability", whyItMattersInTweet: "Confirms behavior in production." },
			{ name: "Feature flags", whyItMattersInTweet: "Allows safe incremental release." },
			{ name: "Incident readiness", whyItMattersInTweet: "Shortens recovery time." },
			{ name: "Postmortem hygiene", whyItMattersInTweet: "Captures repeatable lessons." },
		],
	};
}

test("AnalyzeTweetInputSchema accepts required tweet input", () => {
	const payload: AnalyzeTweetInput = {
		tweetUrlOrId: "https://x.com/user/status/123",
		model: "gpt-4.1",
	};
	const parsed = AnalyzeTweetInputSchema.parse(payload);
	assert.equal(parsed.tweetUrlOrId, payload.tweetUrlOrId);
});

test("AnalyzeTweetResultSchema enforces exactly 5 concepts", () => {
	assert.throws(
		() =>
			AnalyzeTweetResultSchema.parse({
				topic: "topic",
				summary: "summary",
				intent: "intent",
				novelConcepts: [{ name: "Only one", whyItMattersInTweet: "Invalid count" }],
			}),
		/5/,
	);
});

test("SavedAnalysisSchema validates persisted analysis shape", () => {
	const payload: SavedAnalysis = {
		id: "analysis_1",
		userId: "user_1",
		tweetUrlOrId: "https://x.com/user/status/123",
		model: "gpt-4.1",
		createdAt: 1_700_000_000_000,
		...sampleAnalysisResult(),
	};

	const parsed = SavedAnalysisSchema.parse(payload);
	assert.equal(parsed.id, "analysis_1");
	assert.equal(parsed.novelConcepts.length, 5);
});

test("SaveBookmarkInputSchema validates bookmark save payload", () => {
	const payload: SaveBookmarkInput = {
		tweetId: "123",
		tweetText: "A useful thread on production rollouts.",
		tweetUrlOrId: "https://x.com/user/status/123",
		authorUsername: "user",
		authorName: "User Name",
		authorAvatarUrl: "https://pbs.twimg.com/profile_images/avatar.jpg",
		tags: ["infra", "reliability"],
	};

	const parsed = SaveBookmarkInputSchema.parse(payload);
	assert.equal(parsed.tags.length, 2);
});

test("SaveBookmarkInputSchema rejects case-insensitive duplicate tags", () => {
	assert.throws(
		() =>
			SaveBookmarkInputSchema.parse({
				tweetId: "123",
				tweetText: "Tweet text",
				tweetUrlOrId: "https://x.com/user/status/123",
				authorUsername: "user",
				tags: ["Infra", "infra"],
			}),
		/unique/i,
	);
});

test("SaveBookmarkInputSchema rejects simple singular and plural duplicate tags", () => {
	assert.throws(
		() =>
			SaveBookmarkInputSchema.parse({
				tweetId: "123",
				tweetText: "Tweet text",
				tweetUrlOrId: "https://x.com/user/status/123",
				authorUsername: "user",
				tags: ["agent", "agents"],
			}),
		/simple singular\/plural/i,
	);
});

test("validateBookmarkTags allows broader English inflections outside the simple trailing-s rule", () => {
	assert.equal(validateBookmarkTags(["story", "stories"]), null);
	assert.equal(validateBookmarkTags(["class", "classes"]), null);
});

test("validateBookmarkTags keeps existing count and length limits", () => {
	assert.equal(validateBookmarkTags([]), "Add at least one tag.");
	assert.equal(
		validateBookmarkTags(Array.from({ length: 9 }, (_, index) => `tag-${index}`)),
		"Use up to 8 tags per tweet.",
	);
	assert.equal(
		validateBookmarkTags(["this-tag-is-way-too-long-for-the-contract"]),
		"Each tag must be 24 characters or fewer.",
	);
});

test("parseBookmarkTags trims values and collapses exact case-insensitive duplicates", () => {
	assert.deepEqual(parseBookmarkTags(" Strategy, writing ,strategy, Growth "), ["Strategy", "writing", "Growth"]);
});

test("SavedBookmarkSchema validates persisted bookmark shape", () => {
	const payload: SavedBookmark = {
		id: "bookmark_1",
		userId: "user_1",
		tweetId: "123",
		tweetText: "A useful thread on production rollouts.",
		tweetUrlOrId: "https://x.com/user/status/123",
		authorUsername: "user",
		authorName: "User Name",
		authorAvatarUrl: "https://pbs.twimg.com/profile_images/avatar.jpg",
		tags: ["infra"],
		createdAt: 1_700_000_000_000,
		updatedAt: 1_700_000_000_123,
	};

	const parsed = SavedBookmarkSchema.parse(payload);
	assert.equal(parsed.id, "bookmark_1");
	assert.equal(parsed.tags[0], "infra");
});

test("UpdateBookmarkTagsInputSchema validates bookmark tag updates", () => {
	const payload: UpdateBookmarkTagsInput = {
		bookmarkId: "bookmark_1",
		tags: ["strategy", "distribution"],
	};

	const parsed = UpdateBookmarkTagsInputSchema.parse(payload);
	assert.equal(parsed.bookmarkId, "bookmark_1");
	assert.equal(parsed.tags.length, 2);
});

test("DeleteBookmarkInputSchema and DeleteBookmarkResultSchema validate bookmark deletion payloads", () => {
	const input: DeleteBookmarkInput = {
		bookmarkId: "bookmark_1",
	};
	const result: DeleteBookmarkResult = {
		bookmarkId: "bookmark_1",
	};

	assert.equal(DeleteBookmarkInputSchema.parse(input).bookmarkId, "bookmark_1");
	assert.equal(DeleteBookmarkResultSchema.parse(result).bookmarkId, "bookmark_1");
});
