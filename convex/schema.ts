import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  analyses: defineTable({
    userId: v.string(),
    xUrl: v.string(),
    tweetId: v.string(),
    authorUsername: v.string(),
    primaryText: v.string(),
    relatedTexts: v.array(v.string()),
    topic: v.string(),
    appAbout: v.optional(v.string()),
    confidence: v.number(),
    model: v.string(),
    similarPeople: v.optional(
      v.array(
        v.object({
          username: v.string(),
          name: v.string(),
          score: v.number(),
          reason: v.string()
        })
      )
    ),
    topicsToFollow: v.optional(
      v.array(
        v.object({
          topic: v.string(),
          score: v.number(),
          reason: v.string()
        })
      )
    ),
    creatorAnalysis: v.optional(
      v.object({
        username: v.string(),
        shouldFollow: v.boolean(),
        impactScore: v.number(),
        reason: v.string()
      })
    ),
    mode: v.optional(v.string()),
    createdAt: v.number()
  })
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"])
});
