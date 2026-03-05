import assert from "node:assert/strict";
import test from "node:test";
import type { AnalyzeTweetResult } from "@pi-starter/contracts";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
	HeroTweetAnalyzer,
	parseBookmarkTags,
	selectLeadTweetMedia,
	TweetPreviewCard,
} from "../components/hero-tweet-analyzer.js";

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

test("TweetPreviewCard renders tweet interaction metrics", () => {
	const html = renderToStaticMarkup(
		<TweetPreviewCard
			tweet={{
				id: "2028960626685386994",
				text: "New experimental flag",
				authorUsername: "ctatedev",
				publicMetrics: {
					replyCount: 12,
					repostCount: 33,
					likeCount: 240,
					quoteCount: 4,
				},
			}}
			analysis={analysisFixture}
		/>,
	);

	assert.match(html, /id="tweet-interaction-metrics"/);
	assert.match(html, /Replies/);
	assert.match(html, /Reposts/);
	assert.match(html, /Likes/);
	assert.match(html, /Quotes/);
});

test("TweetPreviewCard renders concept names as tags without explanation text", () => {
	const html = renderToStaticMarkup(
		<TweetPreviewCard
			tweet={{
				id: "2028960626685386994",
				text: "New experimental flag",
				authorUsername: "ctatedev",
			}}
			analysis={{
				...analysisFixture,
				novelConcepts: [
					{
						name: "Coding",
						whyItMattersInTweet: "This term appears central to the tweet narrative: coding.",
					},
				],
			}}
		/>,
	);

	assert.match(html, /id="analysis-concept-tags"/);
	assert.match(html, />Coding</);
	assert.doesNotMatch(html, /This term appears central to the tweet narrative/);
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

test("parseBookmarkTags trims values and deduplicates case-insensitively", () => {
	const tags = parseBookmarkTags("  Product, growth,product,  GTM , gtm ");
	assert.deepEqual(tags, ["Product", "growth", "GTM"]);
});

test("HeroTweetAnalyzer hides bookmark controls before analysis result is available", () => {
	const html = renderToStaticMarkup(<HeroTweetAnalyzer />);
	assert.doesNotMatch(html, /id=\"bookmark-save-controls\"/);
});
