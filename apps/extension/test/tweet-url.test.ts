import assert from "node:assert/strict";
import test from "node:test";

import { normalizeTweetUrl } from "../src/shared/tweet-url.js";

test("normalizeTweetUrl returns canonical x.com status URLs", () => {
	assert.equal(
		normalizeTweetUrl("https://x.com/ctatedev/status/2028960626685386994?ref_src=twsrc%5Etfw"),
		"https://x.com/ctatedev/status/2028960626685386994",
	);
	assert.equal(normalizeTweetUrl("/ctatedev/status/2028960626685386994"), "https://x.com/ctatedev/status/2028960626685386994");
});

test("normalizeTweetUrl rejects non-status URLs", () => {
	assert.equal(normalizeTweetUrl("https://x.com/home"), null);
	assert.equal(normalizeTweetUrl("https://example.com/post/1"), null);
});
