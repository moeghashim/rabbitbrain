import assert from "node:assert/strict";
import test from "node:test";

import { buildAnalyzeTweetCanonicalUrl, renderAnalyzeTweetMarkdown } from "../src/index.js";

test("renderAnalyzeTweetMarkdown renders the root tweet, thread, and analysis", () => {
	const markdown = renderAnalyzeTweetMarkdown({
		tweet: {
			id: "2028960626685386994",
			text: "Ship small and often.",
			authorUsername: "ctatedev",
			authorName: "Chris Tate",
		},
		thread: {
			rootTweetId: "2028960626685386994",
			tweets: [
				{
					id: "2028960626685386994",
					text: "Ship small and often.",
					authorUsername: "ctatedev",
					authorName: "Chris Tate",
				},
				{
					id: "2028960626685386995",
					text: "Follow-up detail in the same thread.",
					authorUsername: "ctatedev",
					authorName: "Chris Tate",
					inReplyToTweetId: "2028960626685386994",
				},
			],
		},
		analysis: {
			topic: "Shipping cadence",
			summary: "A concise note on shipping smaller increments.",
			intent: "Encourage steady delivery.",
			novelConcepts: [
				{ name: "Iteration", whyItMattersInTweet: "It frames the delivery cycle." },
				{ name: "Scope", whyItMattersInTweet: "Small scope lowers risk." },
				{ name: "Cadence", whyItMattersInTweet: "The post suggests steady rhythm." },
				{ name: "Feedback", whyItMattersInTweet: "Frequent releases improve learning." },
				{ name: "Confidence", whyItMattersInTweet: "Shipping increases confidence." },
			],
		},
	});

	assert.match(markdown, /^# Chris Tate \(@ctatedev\)$/m);
	assert.match(markdown, /- URL: https:\/\/x\.com\/ctatedev\/status\/2028960626685386994/);
	assert.match(markdown, /## Thread/);
	assert.match(markdown, /### Post 1/);
	assert.match(markdown, /### Post 2/);
	assert.match(markdown, /Follow-up detail in the same thread\./);
	assert.match(markdown, /## Analysis/);
	assert.match(markdown, /- Topic: Shipping cadence/);
	assert.match(markdown, /## Concepts/);
	assert.match(markdown, /- Feedback: Frequent releases improve learning\./);
});

test("buildAnalyzeTweetCanonicalUrl falls back to the i/web path when username is missing", () => {
	const url = buildAnalyzeTweetCanonicalUrl({
		id: "2028960626685386994",
	});

	assert.equal(url, "https://x.com/i/web/status/2028960626685386994");
});
