import assert from "node:assert/strict";
import test from "node:test";

import SupportPage from "../app/support/page.js";

test("support route redirects to privacy", () => {
	assert.throws(
		() => SupportPage(),
		(error: unknown) => error instanceof Error && error.message.includes("NEXT_REDIRECT"),
	);
});
