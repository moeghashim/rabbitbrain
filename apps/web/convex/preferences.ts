import { UserPreferencesInputSchema, UserPreferencesResultSchema } from "@pi-starter/contracts";
import {
	mutationGeneric,
	queryGeneric,
} from "convex/server";
import { v } from "convex/values";

import { requireUserBySession } from "./auth_helpers.js";

export const getPreferences = queryGeneric({
	args: {},
	handler: async (ctx) => {
		const user = await requireUserBySession(ctx);
		const existing = await ctx.db
			.query("userPreferences")
			.withIndex("by_user_id", (query) => query.eq("userId", user._id))
			.unique();
		if (existing) {
			return UserPreferencesResultSchema.parse({
				userId: String(existing.userId),
				defaultModel: existing.defaultModel,
				learningMinutes: existing.learningMinutes,
				updatedAt: existing.updatedAt,
			});
		}

		return UserPreferencesResultSchema.parse({
			userId: String(user._id),
			defaultModel: "gpt-4.1",
			learningMinutes: 10,
			updatedAt: Date.now(),
		});
	},
});

export const updatePreferences = mutationGeneric({
	args: {
		defaultModel: v.string(),
		learningMinutes: v.number(),
	},
	handler: async (ctx, args) => {
		const user = await requireUserBySession(ctx);
		const validated = UserPreferencesInputSchema.parse(args);
		const now = Date.now();
		const existing = await ctx.db
			.query("userPreferences")
			.withIndex("by_user_id", (query) => query.eq("userId", user._id))
			.unique();
		if (existing) {
			await ctx.db.patch(existing._id, {
				defaultModel: validated.defaultModel,
				learningMinutes: validated.learningMinutes,
				updatedAt: now,
			});
			return UserPreferencesResultSchema.parse({
				userId: String(user._id),
				defaultModel: validated.defaultModel,
				learningMinutes: validated.learningMinutes,
				updatedAt: now,
			});
		}

		await ctx.db.insert("userPreferences", {
			userId: user._id,
			defaultModel: validated.defaultModel,
			learningMinutes: validated.learningMinutes,
			updatedAt: now,
		});
		return UserPreferencesResultSchema.parse({
			userId: String(user._id),
			defaultModel: validated.defaultModel,
			learningMinutes: validated.learningMinutes,
			updatedAt: now,
		});
	},
});
