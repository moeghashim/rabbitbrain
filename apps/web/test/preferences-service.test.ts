import assert from "node:assert/strict";
import test from "node:test";

import {
	createPreferencesStore,
	getOrCreatePreferences,
	updatePreferences,
	upsertUserByClerkId,
} from "../src/data/preferences-service.js";

test("upsertUserByClerkId creates new user and reuses existing", () => {
	const store = createPreferencesStore();
	const created = upsertUserByClerkId(
		store,
		{
			clerkUserId: "user_abc",
			email: "moe@example.com",
			name: "Moe",
		},
		100,
	);
	assert.equal(created.id, "user_1");

	const updated = upsertUserByClerkId(
		store,
		{
			clerkUserId: "user_abc",
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
	const user = upsertUserByClerkId(store, { clerkUserId: "user_abc" }, 100);
	const prefs = getOrCreatePreferences(store, user.id, 150);
	assert.equal(prefs.userId, user.id);
	assert.equal(prefs.defaultModel, "gpt-4.1");
	assert.equal(prefs.learningMinutes, 10);
});

test("updatePreferences persists validated values", () => {
	const store = createPreferencesStore();
	const user = upsertUserByClerkId(store, { clerkUserId: "user_abc" }, 100);
	const updated = updatePreferences(
		store,
		user.id,
		{
			defaultModel: "gpt-4.1-mini",
			learningMinutes: 25,
		},
		400,
	);
	assert.equal(updated.userId, user.id);
	assert.equal(updated.defaultModel, "gpt-4.1-mini");
	assert.equal(updated.learningMinutes, 25);
	assert.equal(updated.updatedAt, 400);
});

test("updatePreferences rejects invalid payload", () => {
	const store = createPreferencesStore();
	const user = upsertUserByClerkId(store, { clerkUserId: "user_abc" }, 100);
	assert.throws(
		() =>
			updatePreferences(
				store,
				user.id,
				{
					defaultModel: "gpt-4.1",
					learningMinutes: 1,
				},
				200,
			),
		/minimum/i,
	);
});
