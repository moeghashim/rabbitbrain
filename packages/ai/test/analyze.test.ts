import assert from "node:assert/strict";
import test from "node:test";

import { analyzeTweetPayload } from "../src/index.js";

const VALID_ANALYSIS_JSON = JSON.stringify({
	topic: "Prompt Engineering",
	summary: "A tweet about decomposition.",
	intent: "Teach a practical pattern.",
	novelConcepts: [
		{ name: "Concept 1", whyItMattersInTweet: "Reason 1" },
		{ name: "Concept 2", whyItMattersInTweet: "Reason 2" },
		{ name: "Concept 3", whyItMattersInTweet: "Reason 3" },
		{ name: "Concept 4", whyItMattersInTweet: "Reason 4" },
		{ name: "Concept 5", whyItMattersInTweet: "Reason 5" },
	],
});

test("analyzeTweetPayload parses OpenAI Responses API message content", async () => {
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () =>
		new Response(
			JSON.stringify({
				output: [
					{
						type: "message",
						content: [
							{
								type: "output_text",
								text: VALID_ANALYSIS_JSON,
							},
						],
					},
				],
			}),
			{
				status: 200,
				headers: {
					"content-type": "application/json",
				},
			},
		);

	try {
		const analysis = await analyzeTweetPayload({
			provider: "openai",
			apiKey: "sk-test",
			model: "gpt-4.1",
			tweet: {
				id: "123",
				text: "A tweet about decomposition.",
				raw: {},
			},
		});

		assert.equal(analysis.topic, "Prompt Engineering");
		assert.equal(analysis.novelConcepts.length, 5);
	} finally {
		globalThis.fetch = originalFetch;
	}
});
