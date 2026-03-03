import assert from "node:assert/strict";
import test from "node:test";

import { buildAuthOptions } from "../src/auth/auth.js";

test("buildAuthOptions requires X OAuth and auth secret env vars", () => {
	assert.throws(
		() =>
			buildAuthOptions({
				AUTH_SECRET: "auth_secret",
				AUTH_X_ID: "x_client_id",
			}),
		/Missing required environment variable: AUTH_X_SECRET/,
	);
});

test("buildAuthOptions returns X-only provider config", () => {
	const options = buildAuthOptions({
		AUTH_SECRET: "auth_secret",
		AUTH_X_ID: "x_client_id",
		AUTH_X_SECRET: "x_client_secret",
	});

	assert.equal(options.pages?.signIn, "/sign-in");
	assert.equal(options.session?.strategy, "jwt");
	assert.equal(options.providers[0]?.id, "twitter");
});
