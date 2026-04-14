import { BookmarkSyncStateSchema, BookmarkSyncStatusResponseSchema } from "@pi-starter/contracts";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

import { requireUserBySession } from "./auth_helpers.js";

function pickLatestRecord<T extends { updatedAt: number }>(records: T[]): T | null {
	if (records.length === 0) {
		return null;
	}
	return records.reduce((latest, record) => (record.updatedAt > latest.updatedAt ? record : latest));
}

export const getStatus = queryGeneric({
	args: {},
	handler: async (ctx) => {
		const user = await requireUserBySession(ctx);
		const record = pickLatestRecord(
			await ctx.db
				.query("bookmarkSyncStates")
				.withIndex("by_user_id", (query) => query.eq("userId", user._id))
				.collect(),
		);
		if (!record) {
			return BookmarkSyncStatusResponseSchema.parse({ state: undefined });
		}

		return BookmarkSyncStatusResponseSchema.parse({
			state: {
				userId: String(record.userId),
				lastSyncedAt: record.lastSyncedAt,
				lastError: record.lastError,
				importedCount: record.importedCount,
				updatedAt: record.updatedAt,
			},
		});
	},
});

export const upsertStatusForCurrentUser = mutationGeneric({
	args: {
		lastSyncedAt: v.optional(v.number()),
		lastError: v.optional(v.string()),
		importedCount: v.number(),
		cursor: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await requireUserBySession(ctx);
		const existing = pickLatestRecord(
			await ctx.db
				.query("bookmarkSyncStates")
				.withIndex("by_user_id", (query) => query.eq("userId", user._id))
				.collect(),
		);
		const updatedAt = Date.now();

		if (existing) {
			await ctx.db.patch(existing._id, {
				lastSyncedAt: args.lastSyncedAt,
				lastError: args.lastError,
				importedCount: args.importedCount,
				cursor: args.cursor,
				updatedAt,
			});
			return BookmarkSyncStateSchema.parse({
				userId: String(user._id),
				lastSyncedAt: args.lastSyncedAt,
				lastError: args.lastError,
				importedCount: args.importedCount,
				updatedAt,
			});
		}

		await ctx.db.insert("bookmarkSyncStates", {
			userId: user._id,
			lastSyncedAt: args.lastSyncedAt,
			lastError: args.lastError,
			importedCount: args.importedCount,
			cursor: args.cursor,
			updatedAt,
		});
		return BookmarkSyncStateSchema.parse({
			userId: String(user._id),
			lastSyncedAt: args.lastSyncedAt,
			lastError: args.lastError,
			importedCount: args.importedCount,
			updatedAt,
		});
	},
});

export const listDueSyncJobs = queryGeneric({
	args: {
		beforeTimestamp: v.number(),
		limit: v.number(),
	},
	handler: async (ctx, args) => {
		const credentials = await ctx.db.query("xAccountCredentials").collect();
		const jobs = [];
		for (const credential of credentials) {
			const syncState = pickLatestRecord(
				await ctx.db
					.query("bookmarkSyncStates")
					.withIndex("by_user_id", (query) => query.eq("userId", credential.userId))
					.collect(),
			);
			const lastSyncedAt = syncState?.lastSyncedAt ?? 0;
			if (lastSyncedAt >= args.beforeTimestamp) {
				continue;
			}
			jobs.push({
				userId: String(credential.userId),
				xUserId: credential.xUserId,
				lastSyncedAt: syncState?.lastSyncedAt,
			});
		}

		return jobs.slice(0, Math.max(1, args.limit));
	},
});
