import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	users: defineTable({
		xUserId: v.optional(v.string()),
		clerkUserId: v.optional(v.string()),
		email: v.optional(v.string()),
		name: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_x_user_id", ["xUserId"]),
	userPreferences: defineTable({
		userId: v.id("users"),
		defaultProvider: v.optional(v.string()),
		defaultModel: v.string(),
		learningMinutes: v.number(),
		updatedAt: v.number(),
	}).index("by_user_id", ["userId"]),
	userProviderCredentials: defineTable({
		userId: v.id("users"),
		provider: v.string(),
		encryptedApiKey: v.string(),
		keyHint: v.optional(v.string()),
		updatedAt: v.number(),
	}).index("by_user_id_provider", ["userId", "provider"]),
	analyses: defineTable({
		userId: v.id("users"),
		tweetUrlOrId: v.string(),
		provider: v.optional(v.string()),
		model: v.string(),
		topic: v.string(),
		summary: v.string(),
		intent: v.string(),
		novelConcepts: v.array(
			v.object({
				name: v.string(),
				whyItMattersInTweet: v.string(),
			}),
		),
		createdAt: v.number(),
	}).index("by_user_id_created_at", ["userId", "createdAt"]),
	learningTracks: defineTable({
		userId: v.id("users"),
		analysisId: v.id("analyses"),
		minutesPerDay: v.number(),
		days: v.array(
			v.object({
				day: v.number(),
				title: v.string(),
				focus: v.string(),
				minutes: v.number(),
				tasks: v.object({
					learn: v.string(),
					explain: v.string(),
					check: v.string(),
				}),
			}),
		),
		createdAt: v.number(),
	}).index("by_user_id_created_at", ["userId", "createdAt"]),
	bookmarks: defineTable({
		userId: v.id("users"),
		tweetId: v.string(),
		tweetText: v.string(),
		tweetUrlOrId: v.string(),
		authorUsername: v.string(),
		authorName: v.optional(v.string()),
		authorAvatarUrl: v.optional(v.string()),
		tags: v.array(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user_id_updated_at", ["userId", "updatedAt"])
		.index("by_user_id_tweet_id", ["userId", "tweetId"]),
});
