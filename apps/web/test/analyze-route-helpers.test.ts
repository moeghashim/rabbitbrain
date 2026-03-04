import assert from "node:assert/strict";
import test from "node:test";

import { buildResumeSignInRedirect, mapXErrorCodeToResponse } from "../src/analyze/analyze-route-helpers.js";

test("buildResumeSignInRedirect preserves tweet input for auth callback", () => {
	const redirect = buildResumeSignInRedirect("https://x.com/moe/status/123");
	assert.equal(
		redirect,
		"/auth/popup-start?redirect_url=%2F%3FtweetUrlOrId%3Dhttps%253A%252F%252Fx.com%252Fmoe%252Fstatus%252F123%26analyze%3D1",
	);
});

test("mapXErrorCodeToResponse maps not found and rate limit", () => {
	const notFound = mapXErrorCodeToResponse("NOT_FOUND");
	assert.equal(notFound.status, 404);
	assert.equal(notFound.body.error.message, "Tweet not found. Check the URL and try again.");

	const rateLimited = mapXErrorCodeToResponse("RATE_LIMITED");
	assert.equal(rateLimited.status, 429);
	assert.equal(rateLimited.body.error.code, "RATE_LIMITED");
});

test("mapXErrorCodeToResponse uses provider details for upstream and invalid input", () => {
	const upstream = mapXErrorCodeToResponse("UPSTREAM_ERROR", "Upstream returned malformed JSON payload.");
	assert.equal(upstream.status, 502);
	assert.equal(upstream.body.error.message, "Upstream returned malformed JSON payload.");

	const invalidInput = mapXErrorCodeToResponse("INVALID_INPUT", "Tweet id value is not valid.");
	assert.equal(invalidInput.status, 400);
	assert.equal(invalidInput.body.error.message, "Tweet id value is not valid.");
});
