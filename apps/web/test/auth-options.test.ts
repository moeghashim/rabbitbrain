import assert from "node:assert/strict";
import test from "node:test";

import { buildAuthOptions } from "../src/auth/auth.js";

interface AuthorizationConfig {
	params?: Record<string, string>;
}

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
	const provider = options.providers[0];
	const authorization = provider?.authorization as AuthorizationConfig | undefined;

	assert.equal(options.pages?.signIn, "/sign-in");
	assert.equal(options.session?.strategy, "jwt");
	assert.equal(provider?.id, "twitter");
	assert.equal(authorization?.params?.scope, "users.read tweet.read");
});

test("buildAuthOptions supports non-strict env for build-time route initialization", () => {
	const options = buildAuthOptions({}, { strictEnv: false });
	assert.equal(options.providers[0]?.id, "twitter");
});
