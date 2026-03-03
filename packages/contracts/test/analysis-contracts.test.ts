import assert from "node:assert/strict";
import test from "node:test";

import {
	type AnalyzeTweetInput,
	AnalyzeTweetInputSchema,
	type AnalyzeTweetResult,
	AnalyzeTweetResultSchema,
	type SavedAnalysis,
	SavedAnalysisSchema,
} from "../src/index.js";

function sampleAnalysisResult(): AnalyzeTweetResult {
	return {
		topic: "Model deployment",
		summary: "A post describing deployment confidence.",
		intent: "Share a successful engineering update.",
		novelConcepts: [
			{ name: "Progressive rollout", whyItMattersInTweet: "Reduces blast radius." },
			{ name: "Observability", whyItMattersInTweet: "Confirms behavior in production." },
			{ name: "Feature flags", whyItMattersInTweet: "Allows safe incremental release." },
			{ name: "Incident readiness", whyItMattersInTweet: "Shortens recovery time." },
			{ name: "Postmortem hygiene", whyItMattersInTweet: "Captures repeatable lessons." },
		],
	};
}

test("AnalyzeTweetInputSchema accepts required tweet input", () => {
	const payload: AnalyzeTweetInput = {
		tweetUrlOrId: "https://x.com/user/status/123",
		model: "gpt-4.1",
	};
	const parsed = AnalyzeTweetInputSchema.parse(payload);
	assert.equal(parsed.tweetUrlOrId, payload.tweetUrlOrId);
});

test("AnalyzeTweetResultSchema enforces exactly 5 concepts", () => {
	assert.throws(
		() =>
			AnalyzeTweetResultSchema.parse({
				topic: "topic",
				summary: "summary",
				intent: "intent",
				novelConcepts: [{ name: "Only one", whyItMattersInTweet: "Invalid count" }],
			}),
		/5/,
	);
});

test("SavedAnalysisSchema validates persisted analysis shape", () => {
	const payload: SavedAnalysis = {
		id: "analysis_1",
		userId: "user_1",
		tweetUrlOrId: "https://x.com/user/status/123",
		model: "gpt-4.1",
		createdAt: 1_700_000_000_000,
		...sampleAnalysisResult(),
	};

	const parsed = SavedAnalysisSchema.parse(payload);
	assert.equal(parsed.id, "analysis_1");
	assert.equal(parsed.novelConcepts.length, 5);
});
