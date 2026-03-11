import assert from "node:assert/strict";
import test from "node:test";

import { normalizeStoredModel, normalizeStoredProvider } from "../convex/preferences.js";
import {
	createPreferencesStore,
	getOrCreatePreferences,
	updatePreferences,
	upsertUserByXId,
} from "../src/data/preferences-service.js";

test("upsertUserByXId creates new user and reuses existing", () => {
	const store = createPreferencesStore();
	const created = upsertUserByXId(
		store,
		{
			xUserId: "user_abc",
			email: "moe@example.com",
			name: "Moe",
		},
		100,
	);
	assert.equal(created.id, "user_1");

	const updated = upsertUserByXId(
		store,
		{
			xUserId: "user_abc",
			email: "new@example.com",
			name: "Moe Updated",
		},
		200,
	);
	assert.equal(updated.id, created.id);
	assert.equal(updated.email, "new@example.com");
	assert.equal(updated.updatedAt, 200);
});

test("getOrCreatePreferences returns defaults for new user", () => {
	const store = createPreferencesStore();
	const user = upsertUserByXId(store, { xUserId: "user_abc" }, 100);
	const prefs = getOrCreatePreferences(store, user.id, 150);
	assert.equal(prefs.userId, user.id);
	assert.equal(prefs.defaultProvider, "openai");
	assert.equal(prefs.defaultModel, "gpt-5-mini");
	assert.equal(prefs.learningMinutes, 10);
});

test("updatePreferences persists validated values", () => {
	const store = createPreferencesStore();
	const user = upsertUserByXId(store, { xUserId: "user_abc" }, 100);
	const updated = updatePreferences(
		store,
		user.id,
		{
			defaultProvider: "anthropic",
			defaultModel: "claude-sonnet-4-6",
			learningMinutes: 25,
		},
		400,
	);
	assert.equal(updated.userId, user.id);
	assert.equal(updated.defaultProvider, "anthropic");
	assert.equal(updated.defaultModel, "claude-sonnet-4-6");
	assert.equal(updated.learningMinutes, 25);
	assert.equal(updated.updatedAt, 400);
});

test("updatePreferences rejects invalid payload", () => {
	const store = createPreferencesStore();
	const user = upsertUserByXId(store, { xUserId: "user_abc" }, 100);
	assert.throws(
		() =>
			updatePreferences(
				store,
				user.id,
				{
					defaultProvider: "openai",
					defaultModel: "gpt-4.1",
					learningMinutes: 1,
				},
				200,
			),
		/minimum/i,
	);
});

test("legacy preference normalization falls back to openai defaults", () => {
	const provider = normalizeStoredProvider("");
	const model = normalizeStoredModel("", provider);
	assert.equal(provider, "openai");
	assert.equal(model, "gpt-5-mini");
});
