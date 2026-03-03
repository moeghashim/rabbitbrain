import assert from "node:assert/strict";
import test from "node:test";

import {
	type CreateLearningTrackInput,
	CreateLearningTrackInputSchema,
	type CreateLearningTrackResult,
	CreateLearningTrackResultSchema,
} from "../src/index.js";

test("CreateLearningTrackInputSchema requires analysisId", () => {
	const payload: CreateLearningTrackInput = { analysisId: "analysis_1" };
	const parsed = CreateLearningTrackInputSchema.parse(payload);
	assert.equal(parsed.analysisId, "analysis_1");
});

test("CreateLearningTrackResultSchema validates seven-day track", () => {
	const payload: CreateLearningTrackResult = {
		id: "track_1",
		userId: "user_1",
		analysisId: "analysis_1",
		minutesPerDay: 10,
		days: Array.from({ length: 7 }, (_, index) => ({
			day: index + 1,
			title: `Day ${index + 1}`,
			focus: `Focus ${index + 1}`,
			minutes: 10,
			tasks: {
				learn: "learn task",
				explain: "explain task",
				check: "check task",
			},
		})),
		createdAt: 1_700_000_000_000,
	};

	const parsed = CreateLearningTrackResultSchema.parse(payload);
	assert.equal(parsed.days.length, 7);
	assert.equal(parsed.minutesPerDay, 10);
});
