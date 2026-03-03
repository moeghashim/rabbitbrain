import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

import { requireIdentity } from "./auth-helpers.js";

export const upsertCurrentUser = mutationGeneric({
	args: {
		email: v.optional(v.string()),
		name: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		const now = Date.now();
		const userEmail = args.email ?? identity.email;
		const userName = args.name ?? identity.name;
		const existing = await ctx.db
			.query("users")
			.withIndex("by_x_user_id", (query) => query.eq("xUserId", identity.subject))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				email: userEmail,
				name: userName,
				updatedAt: now,
			});
			return existing._id;
		}

		return await ctx.db.insert("users", {
			xUserId: identity.subject,
			email: userEmail,
			name: userName,
			createdAt: now,
			updatedAt: now,
		});
	},
});
