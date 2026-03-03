import {
	UserPreferencesInputSchema,
	UserPreferencesResultSchema,
	type UserPreferencesInput,
	type UserPreferencesResult,
} from "@pi-starter/contracts";

export interface StoredUser {
	id: string;
	clerkUserId: string;
	email: string | null;
	name: string | null;
	createdAt: number;
	updatedAt: number;
}

export interface PreferencesStore {
	usersByClerkId: Map<string, StoredUser>;
	preferencesByUserId: Map<string, UserPreferencesResult>;
	nextUserId: number;
}

export interface UserIdentityInput {
	clerkUserId: string;
	email?: string | null;
	name?: string | null;
}

const DEFAULT_PREFERENCES: Omit<UserPreferencesResult, "userId" | "updatedAt"> = {
	defaultModel: "gpt-4.1",
	learningMinutes: 10,
};

export function createPreferencesStore(): PreferencesStore {
	return {
		usersByClerkId: new Map<string, StoredUser>(),
		preferencesByUserId: new Map<string, UserPreferencesResult>(),
		nextUserId: 1,
	};
}

export function upsertUserByClerkId(store: PreferencesStore, identity: UserIdentityInput, now: number): StoredUser {
	const existing = store.usersByClerkId.get(identity.clerkUserId);
	if (existing) {
		const updated: StoredUser = {
			...existing,
			email: identity.email ?? existing.email,
			name: identity.name ?? existing.name,
			updatedAt: now,
		};
		store.usersByClerkId.set(identity.clerkUserId, updated);
		return updated;
	}

	const created: StoredUser = {
		id: `user_${store.nextUserId}`,
		clerkUserId: identity.clerkUserId,
		email: identity.email ?? null,
		name: identity.name ?? null,
		createdAt: now,
		updatedAt: now,
	};
	store.nextUserId += 1;
	store.usersByClerkId.set(identity.clerkUserId, created);
	return created;
}

export function getOrCreatePreferences(store: PreferencesStore, userId: string, now: number): UserPreferencesResult {
	const existing = store.preferencesByUserId.get(userId);
	if (existing) {
		return existing;
	}

	const created = UserPreferencesResultSchema.parse({
		userId,
		...DEFAULT_PREFERENCES,
		updatedAt: now,
	});
	store.preferencesByUserId.set(userId, created);
	return created;
}

export function updatePreferences(
	store: PreferencesStore,
	userId: string,
	input: UserPreferencesInput,
	now: number,
): UserPreferencesResult {
	const parsedInput = UserPreferencesInputSchema.parse(input);
	const updated = UserPreferencesResultSchema.parse({
		userId,
		...parsedInput,
		updatedAt: now,
	});
	store.preferencesByUserId.set(userId, updated);
	return updated;
}
