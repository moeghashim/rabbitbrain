import assert from "node:assert/strict";
import test from "node:test";
import type { AnalyzeTweetResult, SavedAnalysis } from "@pi-starter/contracts";
import type { TweetPayload, TweetSourceProvider } from "@pi-starter/x-client";

import { handleAnalyzePost } from "../app/api/analyze/route.js";

test("POST /api/analyze returns tweet.media in response contract", async () => {
	const tweet: TweetPayload = {
		id: "2028960626685386994",
		text: "New experimental flag",
		authorId: "123",
		authorUsername: "ctatedev",
		authorName: "Chris Tate",
		authorAvatarUrl: "https://pbs.twimg.com/profile_images/example.jpg",
		media: [
			{
				mediaKey: "3_photo_1",
				type: "photo",
				url: "https://pbs.twimg.com/media/example.jpg",
				altText: "native image",
				width: 1200,
				height: 675,
			},
			{
				mediaKey: "7_video_1",
				type: "video",
				previewImageUrl: "https://pbs.twimg.com/ext_tw_video_thumb/example.jpg",
			},
		],
		publicMetrics: {
			replyCount: 12,
			repostCount: 33,
			likeCount: 240,
			quoteCount: 4,
		},
		raw: {},
	};

	const fakeClient: TweetSourceProvider = {
		async getTweetByUrlOrId() {
			return tweet;
		},
	};

	const saved: SavedAnalysis = {
		id: "analysis_1",
		userId: "user_1",
		tweetUrlOrId: "https://x.com/ctatedev/status/2028960626685386994",
		provider: "openai",
		model: "gpt-4.1",
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
		createdAt: 1,
	};
	const analysis: AnalyzeTweetResult = {
		topic: "Topic",
		summary: "Summary",
		intent: "Intent",
		novelConcepts: saved.novelConcepts,
	};

	const response = await handleAnalyzePost(
		new Request("http://localhost/api/analyze", {
			method: "POST",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({
				tweetUrlOrId: "https://x.com/ctatedev/status/2028960626685386994",
			}),
		}),
		{
			validateStartupEnvIfNeeded: () => {},
			getServerAuthSession: async () => ({
				user: {
					id: "user_1",
					email: "user@example.com",
					name: "User",
				},
			}),
			createXClient: () => fakeClient,
			getPreferencesForSession: async () => ({
				userId: "user_1",
				defaultProvider: "openai",
				defaultModel: "gpt-4.1",
				learningMinutes: 10,
				updatedAt: 1,
			}),
			getProviderApiKeyForSession: async () => "sk-test",
			analyzeTweetPayload: async () => analysis,
			persistAnalysisForSession: async () => saved,
			reportServerError: () => {},
		},
	);

	assert.equal(response.status, 200);
	const payload = (await response.json()) as {
		tweet: TweetPayload;
		analysis: {
			topic: string;
			summary: string;
			intent: string;
			novelConcepts: SavedAnalysis["novelConcepts"];
		};
	};
	assert.equal(payload.tweet.id, tweet.id);
	assert.deepEqual(payload.tweet.media, tweet.media);
	assert.deepEqual(payload.tweet.publicMetrics, tweet.publicMetrics);
	assert.equal(payload.analysis.topic, saved.topic);
});
