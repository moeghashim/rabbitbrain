import assert from "node:assert/strict";
import test from "node:test";

import { buildFeynmanTrack, parseTweetLearningAnalysisText, prioritizeConcepts } from "../src/index.js";

test("parseTweetLearningAnalysisText accepts valid payload", () => {
	const raw = JSON.stringify({
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

	const parsed = parseTweetLearningAnalysisText(raw);
	assert.equal(parsed.topic, "Prompt Engineering");
	assert.equal(parsed.novelConcepts.length, 5);
});

test("parseTweetLearningAnalysisText rejects malformed payload", () => {
	assert.throws(
		() => parseTweetLearningAnalysisText('{"topic":"x","summary":"y","intent":"z","novelConcepts":[]}'),
		/expected exactly 5 novel concepts/i,
	);
});

test("prioritizeConcepts ranks by novelty then interest with deterministic tie-break", () => {
	const ranked = prioritizeConcepts([
		{
			concept: { name: "Beta", whyItMattersInTweet: "B" },
			familiarity: 5,
			interest: 5,
		},
		{
			concept: { name: "Gamma", whyItMattersInTweet: "G" },
			familiarity: 1,
			interest: 1,
		},
		{
			concept: { name: "Alpha", whyItMattersInTweet: "A" },
			familiarity: 1,
			interest: 1,
		},
	]);

	assert.equal(ranked[0]?.concept.name, "Alpha");
	assert.equal(ranked[1]?.concept.name, "Gamma");
	assert.equal(ranked[2]?.concept.name, "Beta");
	assert.equal(ranked[0]?.rank, 1);
});

test("buildFeynmanTrack creates 7-day learn-explain-check schedule", () => {
	const ranked = prioritizeConcepts([
		{
			concept: { name: "C1", whyItMattersInTweet: "R1" },
			familiarity: 1,
			interest: 5,
		},
		{
			concept: { name: "C2", whyItMattersInTweet: "R2" },
			familiarity: 2,
			interest: 5,
		},
		{
			concept: { name: "C3", whyItMattersInTweet: "R3" },
			familiarity: 3,
			interest: 4,
		},
		{
			concept: { name: "C4", whyItMattersInTweet: "R4" },
			familiarity: 4,
			interest: 3,
		},
		{
			concept: { name: "C5", whyItMattersInTweet: "R5" },
			familiarity: 5,
			interest: 2,
		},
	]);

	const track = buildFeynmanTrack(ranked);
	assert.equal(track.days.length, 7);
	for (const day of track.days) {
		assert.equal(day.minutes, 10);
		assert.ok(day.tasks.learn.length > 0);
		assert.ok(day.tasks.explain.length > 0);
		assert.ok(day.tasks.check.length > 0);
	}
	assert.equal(track.days[5]?.title, "Synthesis Across Concepts");
	assert.equal(track.days[6]?.title, "Teach-Back and Gap Closure");
});
