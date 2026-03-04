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
