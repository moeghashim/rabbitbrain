import assert from "node:assert/strict";
import test from "node:test";
import type { AnalyzeTweetResult, FollowSummary } from "@pi-starter/contracts";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
	AnalyzerFollowControls,
	HeroTweetAnalyzer,
	parseBookmarkTags,
	selectLeadTweetMedia,
	TweetPreviewCard,
	validateBookmarkTags,
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

const emptyFollowSummary: FollowSummary = {
	creatorFollows: [],
	subjectFollows: [],
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

test("validateBookmarkTags rejects simple singular and plural duplicates", () => {
	assert.equal(
		validateBookmarkTags(["agent", "agents"]),
		'Tags must be unique, including simple singular/plural pairs like "agent" and "agents".',
	);
	assert.equal(validateBookmarkTags(["story", "stories"]), null);
});

test("HeroTweetAnalyzer hides bookmark controls before analysis result is available", () => {
	const html = renderToStaticMarkup(<HeroTweetAnalyzer />);
	assert.doesNotMatch(html, /id=\"bookmark-save-controls\"/);
});

test("HeroTweetAnalyzer can hide provider and model selectors", () => {
	const html = renderToStaticMarkup(<HeroTweetAnalyzer showProviderSelector={false} showModelSelector={false} />);
	assert.doesNotMatch(html, /id=\"hero-provider\"/);
	assert.doesNotMatch(html, /id=\"hero-model\"/);
	assert.match(html, /id=\"hero-tweet-url\"/);
});

test("AnalyzerFollowControls renders creator and topic follow actions from active tags", () => {
	const html = renderToStaticMarkup(
		<AnalyzerFollowControls
			tweet={{
				id: "1",
				text: "test",
				authorUsername: "rhys",
				authorName: "Rhys",
			}}
			activeTags={["Strategy", "Writing"]}
			followSummary={emptyFollowSummary}
		/>,
	);

	assert.match(html, /id="analyzer-follow-controls"/);
	assert.match(html, /Follow account/);
	assert.match(html, /Follow @rhys for Strategy/);
	assert.match(html, /Follow topic Writing/);
});

test("AnalyzerFollowControls shows follow status when creator or topic is already followed", () => {
	const html = renderToStaticMarkup(
		<AnalyzerFollowControls
			tweet={{
				id: "1",
				text: "test",
				authorUsername: "@Rhys",
				authorName: "Rhys",
			}}
			activeTags={["Strategy", "Writing"]}
			followSummary={{
				creatorFollows: [
					{
						id: "creator_1",
						userId: "user_1",
						creatorUsername: "rhys",
						scope: "all_feed",
						createdAt: 100,
						updatedAt: 100,
					},
				],
				subjectFollows: [
					{
						id: "subject_1",
						userId: "user_1",
						subjectTag: "Writing",
						createdAt: 100,
						updatedAt: 100,
					},
				],
			}}
		/>,
	);

	assert.match(html, /Following @Rhys/);
	assert.match(html, /Following @Rhys for Strategy/);
	assert.match(html, /Following Topic Writing/);
	assert.doesNotMatch(html, /Follow account/);
});

test("AnalyzerFollowControls prompts for tags when none are selected", () => {
	const html = renderToStaticMarkup(
		<AnalyzerFollowControls
			tweet={{
				id: "1",
				text: "test",
				authorUsername: "rhys",
			}}
			activeTags={[]}
			followSummary={emptyFollowSummary}
		/>,
	);

	assert.match(html, /Select concept tags or type topics above to unlock topic follow actions/);
	assert.doesNotMatch(html, /Follow topic/);
});
