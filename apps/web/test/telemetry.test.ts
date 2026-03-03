import assert from "node:assert/strict";
import test from "node:test";

import { reportServerError } from "../src/telemetry/report-error.js";

test("reportServerError prints structured telemetry payload", () => {
	const errors: string[] = [];
	const original = console.error;
	console.error = (message?: unknown) => {
		errors.push(String(message));
	};

	try {
		reportServerError({
			scope: "analysis.createFromTweetUrl",
			error: new Error("boom"),
			metadata: { stage: "mutation", retryable: false },
		});
	} finally {
		console.error = original;
	}

	assert.equal(errors.length, 1);
	const payload = JSON.parse(errors[0] ?? "{}");
	assert.equal(payload.scope, "analysis.createFromTweetUrl");
	assert.equal(payload.errorMessage, "boom");
	assert.equal(payload.metadata.stage, "mutation");
});
