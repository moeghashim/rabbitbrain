import assert from "node:assert/strict";
import test from "node:test";

import { analyzeAccountTakeaway, analyzeTweetPayload } from "../src/index.js";

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

test("analyzeAccountTakeaway parses OpenAI Responses API message content", async () => {
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () =>
		new Response(
			JSON.stringify({
				output_text: JSON.stringify({
					summary: "The account posts concise execution updates and product lessons.",
					takeaways: [
						"Execution updates are a recurring theme.",
						"Posts are grounded in concrete product work.",
						"Operational feedback loops appear often.",
					],
				}),
			}),
			{
				status: 200,
				headers: {
					"content-type": "application/json",
				},
			},
		);

	try {
		const analysis = await analyzeAccountTakeaway({
			provider: "openai",
			apiKey: "sk-test",
			model: "gpt-4.1",
			account: {
				id: "user_1",
				username: "ctatedev",
				name: "Chris Tate",
			},
			posts: [
				{
					id: "123",
					text: "Ship the smaller change first.",
					authorUsername: "ctatedev",
					raw: {},
				},
			],
		});

		assert.match(analysis.summary, /execution updates/i);
		assert.equal(analysis.takeaways.length, 3);
	} finally {
		globalThis.fetch = originalFetch;
	}
});
