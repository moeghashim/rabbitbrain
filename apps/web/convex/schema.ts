import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	users: defineTable({
		xUserId: v.string(),
		email: v.optional(v.string()),
		name: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_x_user_id", ["xUserId"]),
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
});
