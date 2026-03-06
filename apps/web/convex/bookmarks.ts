import {
	DeleteBookmarkInputSchema,
	DeleteBookmarkResultSchema,
	SaveBookmarkInputSchema,
	SavedBookmarkSchema,
	UpdateBookmarkTagsInputSchema,
} from "@pi-starter/contracts";
import {
	mutationGeneric,
	queryGeneric,
} from "convex/server";
import { v } from "convex/values";

import { requireUserBySession } from "./auth_helpers.js";
import { BOOKMARK_ALREADY_EXISTS_ERROR_CODE } from "../src/bookmarks/errors.js";

function toSavedBookmark(
	record: {
		_id: string;
		userId: string;
		tweetId: string;
		tweetText: string;
		tweetUrlOrId: string;
		authorUsername: string;
		authorName?: string;
		authorAvatarUrl?: string;
		tags: string[];
		createdAt: number;
		updatedAt: number;
	},
) {
	return SavedBookmarkSchema.parse({
		id: record._id,
		userId: record.userId,
		tweetId: record.tweetId,
		tweetText: record.tweetText,
		tweetUrlOrId: record.tweetUrlOrId,
		authorUsername: record.authorUsername,
		authorName: record.authorName,
		authorAvatarUrl: record.authorAvatarUrl,
		tags: record.tags,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt,
	});
}

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
			throw new Error(BOOKMARK_ALREADY_EXISTS_ERROR_CODE);
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

export const updateTags = mutationGeneric({
	args: {
		bookmarkId: v.string(),
		tags: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await requireUserBySession(ctx);
		const validated = UpdateBookmarkTagsInputSchema.parse(args);
		const bookmarkId = ctx.db.normalizeId("bookmarks", validated.bookmarkId);
		if (!bookmarkId) {
			throw new Error("Bookmark not found");
		}

		const existing = await ctx.db.get(bookmarkId);
		if (!existing || String(existing.userId) !== String(user._id)) {
			throw new Error("Bookmark not found");
		}

		const now = Date.now();
		await ctx.db.patch(bookmarkId, {
			tags: validated.tags,
			updatedAt: now,
		});

		return toSavedBookmark({
			_id: String(existing._id),
			userId: String(existing.userId),
			tweetId: existing.tweetId,
			tweetText: existing.tweetText,
			tweetUrlOrId: existing.tweetUrlOrId,
			authorUsername: existing.authorUsername,
			authorName: existing.authorName,
			authorAvatarUrl: existing.authorAvatarUrl,
			tags: validated.tags,
			createdAt: existing.createdAt,
			updatedAt: now,
		});
	},
});

export const remove = mutationGeneric({
	args: {
		bookmarkId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await requireUserBySession(ctx);
		const validated = DeleteBookmarkInputSchema.parse(args);
		const bookmarkId = ctx.db.normalizeId("bookmarks", validated.bookmarkId);
		if (!bookmarkId) {
			throw new Error("Bookmark not found");
		}

		const existing = await ctx.db.get(bookmarkId);
		if (!existing || String(existing.userId) !== String(user._id)) {
			throw new Error("Bookmark not found");
		}

		await ctx.db.delete(bookmarkId);
		return DeleteBookmarkResultSchema.parse({
			bookmarkId: validated.bookmarkId,
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
				toSavedBookmark({
					_id: String(item._id),
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
