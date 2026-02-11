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
    confidence: v.number(),
    model: v.string(),
    createdAt: v.number()
  })
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"])
});
