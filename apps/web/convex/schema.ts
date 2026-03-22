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
		thread: v.optional(
			v.object({
				rootTweetId: v.string(),
				tweets: v.array(
					v.object({
						id: v.string(),
						text: v.string(),
						authorId: v.optional(v.string()),
						authorUsername: v.optional(v.string()),
						authorName: v.optional(v.string()),
						authorAvatarUrl: v.optional(v.string()),
						createdAt: v.optional(v.string()),
						conversationId: v.optional(v.string()),
						inReplyToTweetId: v.optional(v.string()),
						media: v.optional(
							v.array(
								v.object({
									mediaKey: v.string(),
									type: v.union(v.literal("photo"), v.literal("video"), v.literal("animated_gif")),
									url: v.optional(v.string()),
									previewImageUrl: v.optional(v.string()),
									altText: v.optional(v.string()),
									width: v.optional(v.number()),
									height: v.optional(v.number()),
								}),
							),
						),
						publicMetrics: v.optional(
							v.object({
								replyCount: v.optional(v.number()),
								repostCount: v.optional(v.number()),
								likeCount: v.optional(v.number()),
								quoteCount: v.optional(v.number()),
								bookmarkCount: v.optional(v.number()),
							}),
						),
					}),
				),
			}),
		),
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
		thread: v.optional(
			v.object({
				rootTweetId: v.string(),
				tweets: v.array(
					v.object({
						id: v.string(),
						text: v.string(),
						authorId: v.optional(v.string()),
						authorUsername: v.optional(v.string()),
						authorName: v.optional(v.string()),
						authorAvatarUrl: v.optional(v.string()),
						createdAt: v.optional(v.string()),
						conversationId: v.optional(v.string()),
						inReplyToTweetId: v.optional(v.string()),
						media: v.optional(
							v.array(
								v.object({
									mediaKey: v.string(),
									type: v.union(v.literal("photo"), v.literal("video"), v.literal("animated_gif")),
									url: v.optional(v.string()),
									previewImageUrl: v.optional(v.string()),
									altText: v.optional(v.string()),
									width: v.optional(v.number()),
									height: v.optional(v.number()),
								}),
							),
						),
						publicMetrics: v.optional(
							v.object({
								replyCount: v.optional(v.number()),
								repostCount: v.optional(v.number()),
								likeCount: v.optional(v.number()),
								quoteCount: v.optional(v.number()),
								bookmarkCount: v.optional(v.number()),
							}),
						),
					}),
				),
			}),
		),
		tags: v.array(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user_id_updated_at", ["userId", "updatedAt"])
		.index("by_user_id_tweet_id", ["userId", "tweetId"]),
	creatorFollows: defineTable({
		userId: v.id("users"),
		creatorUsername: v.string(),
		creatorUsernameLower: v.string(),
		creatorName: v.optional(v.string()),
		creatorAvatarUrl: v.optional(v.string()),
		scope: v.union(v.literal("subject"), v.literal("all_feed")),
		subjectTag: v.optional(v.string()),
		subjectKey: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user_id_updated_at", ["userId", "updatedAt"])
		.index("by_user_id_creator_scope_subject", ["userId", "creatorUsernameLower", "scope", "subjectKey"]),
	subjectFollows: defineTable({
		userId: v.id("users"),
		subjectTag: v.string(),
		subjectTagLower: v.string(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user_id_updated_at", ["userId", "updatedAt"])
		.index("by_user_id_subject_tag", ["userId", "subjectTagLower"]),
	takeawayFollows: defineTable({
		userId: v.id("users"),
		accountId: v.optional(v.string()),
		accountUsername: v.string(),
		accountUsernameLower: v.string(),
		accountName: v.optional(v.string()),
		accountAvatarUrl: v.optional(v.string()),
		lastRefreshDateKey: v.optional(v.string()),
		lastRefreshedAt: v.optional(v.number()),
		lastRefreshStatus: v.union(v.literal("idle"), v.literal("success"), v.literal("error")),
		lastRefreshError: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user_id_updated_at", ["userId", "updatedAt"])
		.index("by_user_id_account_username", ["userId", "accountUsernameLower"]),
	takeawaySnapshots: defineTable({
		userId: v.id("users"),
		followId: v.id("takeawayFollows"),
		accountId: v.optional(v.string()),
		accountUsername: v.string(),
		accountName: v.optional(v.string()),
		accountAvatarUrl: v.optional(v.string()),
		provider: v.string(),
		model: v.string(),
		summary: v.string(),
		takeaways: v.array(v.string()),
		sampleSize: v.number(),
		snapshotDateKey: v.string(),
		posts: v.array(
			v.object({
				id: v.string(),
				text: v.string(),
				authorId: v.optional(v.string()),
				authorUsername: v.optional(v.string()),
				authorName: v.optional(v.string()),
				authorAvatarUrl: v.optional(v.string()),
				createdAt: v.optional(v.string()),
				conversationId: v.optional(v.string()),
				inReplyToTweetId: v.optional(v.string()),
				media: v.optional(
					v.array(
						v.object({
							mediaKey: v.string(),
							type: v.union(v.literal("photo"), v.literal("video"), v.literal("animated_gif")),
							url: v.optional(v.string()),
							previewImageUrl: v.optional(v.string()),
							altText: v.optional(v.string()),
							width: v.optional(v.number()),
							height: v.optional(v.number()),
						}),
					),
				),
				publicMetrics: v.optional(
					v.object({
						replyCount: v.optional(v.number()),
						repostCount: v.optional(v.number()),
						likeCount: v.optional(v.number()),
						quoteCount: v.optional(v.number()),
						bookmarkCount: v.optional(v.number()),
					}),
				),
			}),
		),
		createdAt: v.number(),
	})
		.index("by_user_id_created_at", ["userId", "createdAt"])
		.index("by_follow_id_created_at", ["followId", "createdAt"])
		.index("by_follow_id_snapshot_date_key", ["followId", "snapshotDateKey"]),
});
