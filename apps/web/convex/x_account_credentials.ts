import { queryGeneric, mutationGeneric } from "convex/server";
import { v } from "convex/values";

import { requireUserBySession } from "./auth_helpers.js";

function pickLatestRecord<T extends { updatedAt: number }>(records: T[]): T | null {
	if (records.length === 0) {
		return null;
	}
	return records.reduce((latest, record) => (record.updatedAt > latest.updatedAt ? record : latest));
}

export const getForCurrentUser = queryGeneric({
	args: {},
	handler: async (ctx) => {
		const user = await requireUserBySession(ctx);
		const record = pickLatestRecord(
			await ctx.db
				.query("xAccountCredentials")
				.withIndex("by_user_id", (query) => query.eq("userId", user._id))
				.collect(),
		);
		if (!record) {
			return null;
		}

		return {
			xUserId: record.xUserId,
			encryptedAccessToken: record.encryptedAccessToken,
			encryptedRefreshToken: record.encryptedRefreshToken,
			tokenType: record.tokenType,
			scope: record.scope,
			expiresAt: record.expiresAt,
			updatedAt: record.updatedAt,
		};
	},
});

export const upsertForCurrentUser = mutationGeneric({
	args: {
		xUserId: v.string(),
		encryptedAccessToken: v.string(),
		encryptedRefreshToken: v.optional(v.string()),
		tokenType: v.optional(v.string()),
		scope: v.optional(v.string()),
		expiresAt: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const user = await requireUserBySession(ctx);
		const existing = pickLatestRecord(
			await ctx.db
				.query("xAccountCredentials")
				.withIndex("by_user_id", (query) => query.eq("userId", user._id))
				.collect(),
		);
		const updatedAt = Date.now();

		if (existing) {
			await ctx.db.patch(existing._id, {
				xUserId: args.xUserId,
				encryptedAccessToken: args.encryptedAccessToken,
				encryptedRefreshToken: args.encryptedRefreshToken,
				tokenType: args.tokenType,
				scope: args.scope,
				expiresAt: args.expiresAt,
				updatedAt,
			});
		} else {
			await ctx.db.insert("xAccountCredentials", {
				userId: user._id,
				xUserId: args.xUserId,
				encryptedAccessToken: args.encryptedAccessToken,
				encryptedRefreshToken: args.encryptedRefreshToken,
				tokenType: args.tokenType,
				scope: args.scope,
				expiresAt: args.expiresAt,
				updatedAt,
			});
		}

		return {
			xUserId: args.xUserId,
			updatedAt,
			expiresAt: args.expiresAt,
		};
	},
});

export const getByUserId = queryGeneric({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		const userId = ctx.db.normalizeId("users", args.userId);
		if (!userId) {
			return null;
		}
		const record = pickLatestRecord(
			await ctx.db
				.query("xAccountCredentials")
				.withIndex("by_user_id", (query) => query.eq("userId", userId))
				.collect(),
		);
		if (!record) {
			return null;
		}

		return {
			xUserId: record.xUserId,
			encryptedAccessToken: record.encryptedAccessToken,
			encryptedRefreshToken: record.encryptedRefreshToken,
			tokenType: record.tokenType,
			scope: record.scope,
			expiresAt: record.expiresAt,
			updatedAt: record.updatedAt,
		};
	},
});
