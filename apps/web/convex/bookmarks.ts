import {
	SaveBookmarkInputSchema,
	SavedBookmarkSchema,
} from "@pi-starter/contracts";
import {
	mutationGeneric,
	queryGeneric,
} from "convex/server";
import { v } from "convex/values";

import { requireUserBySession } from "./auth_helpers.js";

export const save = mutationGeneric({
	args: {
		tweetId: v.string(),
		tweetText: v.string(),
		tweetUrlOrId: v.string(),
		authorUsername: v.string(),
		authorName: v.optional(v.string()),
		authorAvatarUrl: v.optional(v.string()),
		tags: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await requireUserBySession(ctx);
		const validated = SaveBookmarkInputSchema.parse(args);
		const now = Date.now();
		const existing = await ctx.db
			.query("bookmarks")
			.withIndex("by_user_id_tweet_id", (query) => query.eq("userId", user._id))
			.filter((query) => query.eq(query.field("tweetId"), validated.tweetId))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				tweetText: validated.tweetText,
				tweetUrlOrId: validated.tweetUrlOrId,
				authorUsername: validated.authorUsername,
				authorName: validated.authorName,
				authorAvatarUrl: validated.authorAvatarUrl,
				tags: validated.tags,
				updatedAt: now,
			});

			return SavedBookmarkSchema.parse({
				id: String(existing._id),
				userId: String(user._id),
				tweetId: validated.tweetId,
				tweetText: validated.tweetText,
				tweetUrlOrId: validated.tweetUrlOrId,
				authorUsername: validated.authorUsername,
				authorName: validated.authorName,
				authorAvatarUrl: validated.authorAvatarUrl,
				tags: validated.tags,
				createdAt: existing.createdAt,
				updatedAt: now,
			});
		}

		const bookmarkId = await ctx.db.insert("bookmarks", {
			userId: user._id,
			tweetId: validated.tweetId,
			tweetText: validated.tweetText,
			tweetUrlOrId: validated.tweetUrlOrId,
			authorUsername: validated.authorUsername,
			authorName: validated.authorName,
			authorAvatarUrl: validated.authorAvatarUrl,
			tags: validated.tags,
			createdAt: now,
			updatedAt: now,
		});

		return SavedBookmarkSchema.parse({
			id: String(bookmarkId),
			userId: String(user._id),
			...validated,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const listByUser = queryGeneric({
	args: {},
	handler: async (ctx) => {
		const user = await requireUserBySession(ctx);
		const records = await ctx.db
			.query("bookmarks")
			.withIndex("by_user_id_updated_at", (query) => query.eq("userId", user._id))
			.collect();

		return records
			.sort((left, right) => right.updatedAt - left.updatedAt)
			.map((item) =>
				SavedBookmarkSchema.parse({
					id: String(item._id),
					userId: String(item.userId),
					tweetId: item.tweetId,
					tweetText: item.tweetText,
					tweetUrlOrId: item.tweetUrlOrId,
					authorUsername: item.authorUsername,
					authorName: item.authorName,
					authorAvatarUrl: item.authorAvatarUrl,
					tags: item.tags,
					createdAt: item.createdAt,
					updatedAt: item.updatedAt,
				}),
			);
	},
});
