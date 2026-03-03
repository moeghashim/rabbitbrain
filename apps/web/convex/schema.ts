import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	users: defineTable({
		clerkUserId: v.string(),
		email: v.optional(v.string()),
		name: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_clerk_user_id", ["clerkUserId"]),
	userPreferences: defineTable({
		userId: v.id("users"),
		defaultModel: v.string(),
		learningMinutes: v.number(),
		updatedAt: v.number(),
	}).index("by_user_id", ["userId"]),
	analyses: defineTable({
		userId: v.id("users"),
		tweetUrlOrId: v.string(),
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
});
