import assert from "node:assert/strict";
import test from "node:test";
import type { AnalyzeTweetResult } from "@pi-starter/contracts";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { selectLeadTweetMedia, TweetPreviewCard } from "../components/hero-tweet-analyzer.js";

const analysisFixture: AnalyzeTweetResult = {
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
};

test("TweetPreviewCard renders image media for photo posts", () => {
	const html = renderToStaticMarkup(
		<TweetPreviewCard
			tweet={{
				id: "2028960626685386994",
				text: "New experimental flag",
				authorUsername: "ctatedev",
				media: [
					{
						mediaKey: "3_photo_1",
						type: "photo",
						url: "https://pbs.twimg.com/media/example-photo.jpg",
						altText: "Native image",
					},
				],
			}}
			analysis={analysisFixture}
		/>,
	);

	assert.match(html, /src="https:\/\/pbs\.twimg\.com\/media\/example-photo\.jpg"/);
	assert.doesNotMatch(html, /Open on X/);
});

test("TweetPreviewCard renders video preview as Open on X link", () => {
	const html = renderToStaticMarkup(
		<TweetPreviewCard
			tweet={{
				id: "2028960626685386994",
				text: "New experimental flag",
				authorUsername: "ctatedev",
				media: [
					{
						mediaKey: "7_video_1",
						type: "video",
						previewImageUrl: "https://pbs.twimg.com/ext_tw_video_thumb/example.jpg",
					},
				],
			}}
			analysis={analysisFixture}
		/>,
	);

	assert.match(html, /href="https:\/\/x\.com\/ctatedev\/status\/2028960626685386994"/);
	assert.match(html, /Video - Open on X/);
});

test("selectLeadTweetMedia returns only the first media item", () => {
	const leadMedia = selectLeadTweetMedia({
		id: "1",
		text: "test",
		media: [
			{ mediaKey: "first", type: "video", previewImageUrl: "https://example.com/first.jpg" },
			{ mediaKey: "second", type: "photo", url: "https://example.com/second.jpg" },
		],
	});

	assert.equal(leadMedia?.mediaKey, "first");
});

