import assert from "node:assert/strict";
import test from "node:test";

import {
	readJsonResponse,
	readResponseErrorMessage,
} from "../src/http/read-json-response.js";

test("readJsonResponse returns null for an empty response body", async () => {
	const response = new Response(null, {
		status: 502,
		headers: { "content-type": "application/json" },
	});

	assert.equal(await readJsonResponse(response), null);
});

test("readJsonResponse returns null for non-JSON response bodies", async () => {
	const response = new Response("<html>gateway failure</html>", {
		status: 502,
		headers: { "content-type": "text/html" },
	});

	assert.equal(await readJsonResponse(response), null);
});

test("readJsonResponse parses valid JSON bodies", async () => {
	const response = Response.json({ ok: true, count: 2 });

	assert.deepEqual(await readJsonResponse<{ ok: boolean; count: number }>(response), {
		ok: true,
		count: 2,
	});
});

test("readResponseErrorMessage falls back when payload is missing or blank", () => {
	assert.equal(readResponseErrorMessage(null, "Fallback message"), "Fallback message");
	assert.equal(
		readResponseErrorMessage({ error: { message: "   " } }, "Fallback message"),
		"Fallback message",
	);
});

test("readResponseErrorMessage returns the API error message when present", () => {
	assert.equal(
		readResponseErrorMessage({ error: { message: "Unauthorized" } }, "Fallback message"),
		"Unauthorized",
	);
});

test("readResponseErrorMessage ignores non-error payload shapes", () => {
	assert.equal(
		readResponseErrorMessage({ creatorFollows: [], subjectFollows: [] }, "Fallback message"),
		"Fallback message",
	);
});
