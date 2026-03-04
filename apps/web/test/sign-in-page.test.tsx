import assert from "node:assert/strict";
import test from "node:test";

import SignInPage from "../app/sign-in/[[...sign-in]]/page.js";

test("sign-in route immediately redirects to popup auth flow", () => {
	assert.throws(
		() => SignInPage({ searchParams: {} }),
		(error: unknown) => error instanceof Error && error.message.includes("NEXT_REDIRECT"),
	);
});
