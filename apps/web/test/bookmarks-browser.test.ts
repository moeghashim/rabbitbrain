import assert from "node:assert/strict";
import test from "node:test";

import type { SavedBookmark } from "@pi-starter/contracts";

import { filterBookmarksByTags } from "../components/bookmarks-browser.js";

function createBookmark(id: string, tags: string[]): SavedBookmark {
	return {
		id,
		userId: "user_1",
		tweetId: `tweet_${id}`,
		tweetText: `tweet text ${id}`,
		tweetUrlOrId: `https://x.com/user/status/${id}`,
		authorUsername: "user",
		authorName: "User",
		authorAvatarUrl: undefined,
		tags,
		createdAt: 100,
		updatedAt: 100,
	};
}

test("filterBookmarksByTags returns all bookmarks when no tags are selected", () => {
	const bookmarks = [createBookmark("1", ["Strategy"]), createBookmark("2", ["Growth"])];
	const filtered = filterBookmarksByTags(bookmarks, []);
	assert.deepEqual(filtered, bookmarks);
});

test("filterBookmarksByTags matches selected tags case-insensitively", () => {
	const bookmarks = [
		createBookmark("1", ["Strategy", "Writing"]),
		createBookmark("2", ["Growth"]),
		createBookmark("3", ["Ops"]),
	];
	const filtered = filterBookmarksByTags(bookmarks, ["strategy", "GROWTH"]);
	assert.deepEqual(
		filtered.map((bookmark) => bookmark.id),
		["1", "2"],
	);
});

test("filterBookmarksByTags ignores empty selected values", () => {
	const bookmarks = [createBookmark("1", ["Strategy"]), createBookmark("2", ["Growth"])];
	const filtered = filterBookmarksByTags(bookmarks, ["", "  "]);
	assert.deepEqual(filtered, bookmarks);
});
