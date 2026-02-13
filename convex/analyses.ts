import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

export const create = mutationGeneric({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("analyses", args);
  }
});

export const listByUser = queryGeneric({
  args: {
    userId: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("analyses")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 25);
  }
});

export const getById = queryGeneric({
  args: {
    id: v.id("analyses"),
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    if (!record || record.userId !== args.userId) {
      return null;
    }

    return record;
  }
});
