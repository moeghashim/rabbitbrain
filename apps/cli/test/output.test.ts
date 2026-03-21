import assert from "node:assert/strict";
import test from "node:test";

import { buildAnalyzeCliJsonResult, buildThreadCanonicalUrl, renderThreadMarkdown } from "../src/output.js";

test("buildThreadCanonicalUrl uses the author handle when present", () => {
	assert.equal(
		buildThreadCanonicalUrl({
			id: "123",
			text: "hello",
			authorUsername: "ctatedev",
			raw: {},
		}),
		"https://x.com/ctatedev/status/123",
	);
});

test("buildAnalyzeCliJsonResult preserves thread payload for --json output", () => {
	const result = buildAnalyzeCliJsonResult({
		tweet: {
			id: "123",
			text: "Root",
			authorUsername: "ctatedev",
			raw: {},
		},
		thread: {
			rootTweetId: "123",
			tweets: [
				{
					id: "123",
					text: "Root",
					authorUsername: "ctatedev",
					raw: {},
				},
				{
					id: "124",
					text: "Reply",
					authorUsername: "ctatedev",
					inReplyToTweetId: "123",
					raw: {},
				},
			],
		},
		analysis: {
			topic: "Topic",
			summary: "Summary",
			intent: "Intent",
			novelConcepts: [
				{ name: "One", whyItMattersInTweet: "A" },
				{ name: "Two", whyItMattersInTweet: "B" },
				{ name: "Three", whyItMattersInTweet: "C" },
				{ name: "Four", whyItMattersInTweet: "D" },
				{ name: "Five", whyItMattersInTweet: "E" },
			],
		},
		provider: "openai",
		model: "gpt-4.1",
	});

	assert.equal(result.thread.tweets.length, 2);
	assert.equal(result.thread.tweets[1]?.inReplyToTweetId, "123");
	assert.equal(result.provider, "openai");
});

test("renderThreadMarkdown lists every thread post in order", () => {
	const markdown = renderThreadMarkdown({
		rootTweetId: "123",
		tweets: [
			{
				id: "123",
				text: "Root",
				authorUsername: "ctatedev",
				raw: {},
			},
			{
				id: "124",
				text: "Reply",
				authorUsername: "ctatedev",
				raw: {},
			},
		],
	});

	assert.match(markdown, /# Thread \(2 posts\)/);
	assert.match(markdown, /## 1\. @ctatedev/);
	assert.match(markdown, /## 2\. @ctatedev/);
	assert.match(markdown, /Reply/);
});
