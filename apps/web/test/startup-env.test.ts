import assert from "node:assert/strict";
import test from "node:test";

import { validateStartupEnv } from "../src/config/startup-env.js";

test("validateStartupEnv accepts required web and x env vars", () => {
	const result = validateStartupEnv({
		NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
		CLERK_SECRET_KEY: "sk_test_123",
		NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
		CONVEX_DEPLOYMENT: "dev:workspace",
		X_API_KEY: "x_api_key",
		X_API_SECRET: "x_api_secret",
		X_BEARER_TOKEN: "x_bearer_token",
	});

	assert.equal(result.clerkPublishableKey, "pk_test_123");
	assert.equal(result.convexDeployment, "dev:workspace");
});

test("validateStartupEnv throws on missing required env vars", () => {
	assert.throws(
		() =>
			validateStartupEnv({
				NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
				CLERK_SECRET_KEY: "sk_test_123",
				NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
				CONVEX_DEPLOYMENT: "dev:workspace",
				X_API_KEY: "x_api_key",
				X_API_SECRET: "x_api_secret",
			}),
		/Missing required environment variable: X_BEARER_TOKEN/,
	);
});
