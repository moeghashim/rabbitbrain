import assert from "node:assert/strict";
import test from "node:test";

import { validateMiddlewareEnv, validateStartupEnv } from "../src/config/startup-env.js";

test("validateStartupEnv accepts required web and x env vars", () => {
	const result = validateStartupEnv({
		AUTH_SECRET: "auth_secret",
		AUTH_X_ID: "x_client_id",
		AUTH_X_SECRET: "x_client_secret",
		NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
		CONVEX_DEPLOYMENT: "dev:workspace",
		CONVEX_DEPLOY_KEY: "convex_deploy_key",
		USER_SECRETS_ENCRYPTION_KEY: "encryption_key",
		X_API_KEY: "x_api_key",
		X_API_SECRET: "x_api_secret",
		X_BEARER_TOKEN: "x_bearer_token",
	});

	assert.equal(result.authXId, "x_client_id");
	assert.equal(result.convexDeployment, "dev:workspace");
	assert.equal(result.convexDeployKey, "convex_deploy_key");
});

test("validateStartupEnv throws on missing required env vars", () => {
	assert.throws(
		() =>
			validateStartupEnv({
				AUTH_SECRET: "auth_secret",
				AUTH_X_ID: "x_client_id",
				AUTH_X_SECRET: "x_client_secret",
				NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
				CONVEX_DEPLOYMENT: "dev:workspace",
				CONVEX_DEPLOY_KEY: "convex_deploy_key",
				USER_SECRETS_ENCRYPTION_KEY: "encryption_key",
				X_API_KEY: "x_api_key",
				X_API_SECRET: "x_api_secret",
			}),
		/Missing required environment variable: X_BEARER_TOKEN/,
	);
});

test("validateMiddlewareEnv only requires auth secret", () => {
	const result = validateMiddlewareEnv({
		AUTH_SECRET: "auth_secret",
	});
	assert.equal(result.authSecret, "auth_secret");
});
