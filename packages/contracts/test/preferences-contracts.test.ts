import assert from "node:assert/strict";
import test from "node:test";

import {
	type UserPreferencesInput,
	UserPreferencesInputSchema,
	type UserPreferencesResult,
	UserPreferencesResultSchema,
} from "../src/index.js";

test("UserPreferencesInputSchema validates valid payload", () => {
	const payload: UserPreferencesInput = {
		defaultProvider: "openai",
		defaultModel: "gpt-4.1",
		learningMinutes: 25,
	};

	const parsed = UserPreferencesInputSchema.parse(payload);
	assert.equal(parsed.defaultProvider, "openai");
	assert.equal(parsed.defaultModel, "gpt-4.1");
	assert.equal(parsed.learningMinutes, 25);
});

test("UserPreferencesInputSchema rejects out-of-range minutes", () => {
	assert.throws(
		() =>
			UserPreferencesInputSchema.parse({ defaultProvider: "openai", defaultModel: "gpt-4.1", learningMinutes: 1 }),
		/minimum/i,
	);
});

test("UserPreferencesResultSchema validates persisted payload", () => {
	const payload: UserPreferencesResult = {
		userId: "user_123",
		defaultProvider: "openai",
		defaultModel: "gpt-4.1",
		learningMinutes: 30,
		updatedAt: 1_700_000_000_000,
	};

	const parsed = UserPreferencesResultSchema.parse(payload);
	assert.equal(parsed.userId, "user_123");
	assert.equal(parsed.updatedAt, 1_700_000_000_000);
});
