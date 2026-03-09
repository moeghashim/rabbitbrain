import assert from "node:assert/strict";
import test from "node:test";

import {
	buildTwitterAuthSubmission,
	fetchTwitterAuthCsrfToken,
	TWITTER_AUTH_CSRF_PATH,
	TWITTER_AUTH_SIGNIN_PATH,
} from "../src/auth/start-twitter-auth.js";

test("buildTwitterAuthSubmission posts to the same-origin twitter auth endpoint", () => {
	const submission = buildTwitterAuthSubmission("/auth/popup-complete?redirect_url=%2Fapp", "csrf_token");

	assert.equal(submission.action, TWITTER_AUTH_SIGNIN_PATH);
	assert.equal(submission.method, "POST");
	assert.deepEqual(submission.fields, [
		{ name: "csrfToken", value: "csrf_token" },
		{ name: "callbackUrl", value: "/auth/popup-complete?redirect_url=%2Fapp" },
	]);
});

test("fetchTwitterAuthCsrfToken reads the same-origin csrf endpoint", async () => {
	let requestedPath = "";
	let requestedCredentials = "";
	let requestedCache = "";

	const csrfToken = await fetchTwitterAuthCsrfToken(async (input, init) => {
		requestedPath = String(input);
		requestedCredentials = init?.credentials ?? "";
		requestedCache = init?.cache ?? "";
		return Response.json({ csrfToken: "csrf_token" });
	});

	assert.equal(csrfToken, "csrf_token");
	assert.equal(requestedPath, TWITTER_AUTH_CSRF_PATH);
	assert.equal(requestedCredentials, "same-origin");
	assert.equal(requestedCache, "no-store");
});

test("fetchTwitterAuthCsrfToken rejects malformed csrf payloads", async () => {
	await assert.rejects(
		async () =>
			await fetchTwitterAuthCsrfToken(async () => {
				return Response.json({});
			}),
		/Unable to start Twitter sign in\./,
	);
});
