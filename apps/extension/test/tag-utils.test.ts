import assert from "node:assert/strict";
import test from "node:test";

import { parseBookmarkTags, validateBookmarkTags } from "../src/shared/tag-utils.js";

test("parseBookmarkTags trims values and removes case-insensitive duplicates", () => {
	assert.deepEqual(parseBookmarkTags(" Strategy, writing ,strategy, Growth "), ["Strategy", "writing", "Growth"]);
});

test("validateBookmarkTags enforces bookmark tag rules", () => {
	assert.equal(validateBookmarkTags([]), "Add at least one tag.");
	assert.equal(validateBookmarkTags(Array.from({ length: 9 }, (_, index) => `tag-${index}`)), "Use up to 8 tags per tweet.");
	assert.equal(validateBookmarkTags(["this-tag-is-way-too-long-for-the-contract"]), "Each tag must be 24 characters or fewer.");
	assert.equal(validateBookmarkTags(["strategy", "growth"]), null);
	assert.equal(
		validateBookmarkTags(["agent", "agents"]),
		'Tags must be unique, including simple singular/plural pairs like "agent" and "agents".',
	);
	assert.equal(validateBookmarkTags(["story", "stories"]), null);
});
