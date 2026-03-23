import assert from "node:assert/strict";
import test from "node:test";

import { AnalyzeTweetResponseSchema, ExtensionSessionStatusSchema } from "../src/index.js";

test("AnalyzeTweetResponseSchema accepts tweet previews with media and metrics", () => {
	const parsed = AnalyzeTweetResponseSchema.parse({
		tweet: {
			id: "2028960626685386994",
			text: "Ship small and often.",
			authorUsername: "ctatedev",
			authorName: "Chris Tate",
			authorAvatarUrl: "https://pbs.twimg.com/profile_images/example.jpg",
			media: [
				{
					mediaKey: "3_photo",
					type: "photo",
					url: "https://pbs.twimg.com/media/example.jpg",
					width: 1200,
					height: 675,
				},
			],
			publicMetrics: {
				replyCount: 12,
				repostCount: 33,
				likeCount: 240,
				quoteCount: 4,
				impressionCount: 1024,
			},
		},
		analysis: {
			topic: "Shipping",
			summary: "A post about incremental delivery.",
			intent: "Encourage consistent release habits.",
			novelConcepts: [
				{ name: "Iteration", whyItMattersInTweet: "The post encourages frequent delivery." },
				{ name: "Cadence", whyItMattersInTweet: "It signals a repeated operating rhythm." },
				{ name: "Scope", whyItMattersInTweet: "Small changes reduce risk." },
				{ name: "Confidence", whyItMattersInTweet: "Shipping builds momentum." },
				{ name: "Feedback", whyItMattersInTweet: "Frequent releases shorten loops." },
			],
		},
	});

	assert.equal(parsed.tweet.media?.[0]?.type, "photo");
	assert.equal(parsed.tweet.publicMetrics?.impressionCount, 1024);
	assert.equal(parsed.analysis.novelConcepts.length, 5);
});

test("ExtensionSessionStatusSchema rejects authenticated sessions without a user", () => {
	assert.throws(
		() =>
			ExtensionSessionStatusSchema.parse({
				authenticated: true,
			}),
		/user/i,
	);
});
