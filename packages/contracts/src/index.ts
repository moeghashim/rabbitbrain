import { z } from "zod";

import { validateBookmarkTags } from "./bookmark-tags.js";

export interface ServiceHealth {
	service: string;
	ok: boolean;
}

export const UserPreferencesInputSchema = z.object({
	defaultModel: z.string().min(1, "defaultModel is required"),
	learningMinutes: z.number().int().min(5).max(120),
});

export const UserPreferencesResultSchema = UserPreferencesInputSchema.extend({
	userId: z.string().min(1, "userId is required"),
	updatedAt: z.number().int().nonnegative(),
});

export type UserPreferencesInput = z.infer<typeof UserPreferencesInputSchema>;
export type UserPreferencesResult = z.infer<typeof UserPreferencesResultSchema>;

export const AnalyzeTweetInputSchema = z.object({
	tweetUrlOrId: z.string().min(1, "tweetUrlOrId is required"),
	model: z.string().min(1).optional(),
});

export const AnalyzeConceptSchema = z.object({
	name: z.string().min(1),
	whyItMattersInTweet: z.string().min(1),
});

export const AnalyzeTweetResultSchema = z.object({
	topic: z.string().min(1),
	summary: z.string().min(1),
	intent: z.string().min(1),
	novelConcepts: z.array(AnalyzeConceptSchema).length(5),
});

export const TweetMediaSchema = z.object({
	mediaKey: z.string().min(1),
	type: z.enum(["photo", "video", "animated_gif"]),
	url: z.string().url().optional(),
	previewImageUrl: z.string().url().optional(),
	altText: z.string().min(1).optional(),
	width: z.number().int().positive().optional(),
	height: z.number().int().positive().optional(),
});

export const TweetPublicMetricsSchema = z.object({
	replyCount: z.number().int().nonnegative().optional(),
	repostCount: z.number().int().nonnegative().optional(),
	likeCount: z.number().int().nonnegative().optional(),
	quoteCount: z.number().int().nonnegative().optional(),
	bookmarkCount: z.number().int().nonnegative().optional(),
});

export const TweetPreviewSchema = z.object({
	id: z.string().min(1),
	text: z.string().min(1),
	authorId: z.string().min(1).optional(),
	authorUsername: z.string().min(1).optional(),
	authorName: z.string().min(1).optional(),
	authorAvatarUrl: z.string().url().optional(),
	media: z.array(TweetMediaSchema).optional(),
	publicMetrics: TweetPublicMetricsSchema.optional(),
});

export const AnalyzeTweetResponseSchema = z.object({
	tweet: TweetPreviewSchema,
	analysis: AnalyzeTweetResultSchema,
});

export const ExtensionSessionUserSchema = z.object({
	id: z.string().min(1),
	xUsername: z.string().min(1).optional(),
	name: z.string().min(1).nullable().optional(),
});

export const ExtensionSessionStatusSchema = z
	.object({
		authenticated: z.boolean(),
		user: ExtensionSessionUserSchema.optional(),
	})
	.refine((value) => !value.authenticated || value.user !== undefined, {
		message: "Authenticated extension sessions must include a user.",
		path: ["user"],
	});

export const SavedAnalysisSchema = AnalyzeTweetResultSchema.extend({
	id: z.string().min(1),
	userId: z.string().min(1),
	tweetUrlOrId: z.string().min(1),
	model: z.string().min(1),
	createdAt: z.number().int().nonnegative(),
});

export const BookmarkTagSchema = z.string().min(1).max(24);

const BookmarkTagsSchema = z.array(BookmarkTagSchema).superRefine((tags, context) => {
	const validationError = validateBookmarkTags(tags);
	if (!validationError) {
		return;
	}

	context.addIssue({
		code: z.ZodIssueCode.custom,
		message: validationError,
	});
});

export const BookmarkedTweetSchema = z.object({
	tweetId: z.string().min(1),
	tweetText: z.string().min(1),
	tweetUrlOrId: z.string().min(1),
	authorUsername: z.string().min(1),
	authorName: z.string().min(1).optional(),
	authorAvatarUrl: z.string().url().optional(),
});

export const SaveBookmarkInputSchema = BookmarkedTweetSchema.extend({
	tags: BookmarkTagsSchema,
});

export const UpdateBookmarkTagsInputSchema = z.object({
	bookmarkId: z.string().min(1),
	tags: BookmarkTagsSchema,
});

export const DeleteBookmarkInputSchema = z.object({
	bookmarkId: z.string().min(1),
});

export const DeleteBookmarkResultSchema = z.object({
	bookmarkId: z.string().min(1),
});

export const SavedBookmarkSchema = SaveBookmarkInputSchema.extend({
	id: z.string().min(1),
	userId: z.string().min(1),
	createdAt: z.number().int().nonnegative(),
	updatedAt: z.number().int().nonnegative(),
});

export type AnalyzeTweetInput = z.infer<typeof AnalyzeTweetInputSchema>;
export type AnalyzeTweetResult = z.infer<typeof AnalyzeTweetResultSchema>;
export type TweetMedia = z.infer<typeof TweetMediaSchema>;
export type TweetPublicMetrics = z.infer<typeof TweetPublicMetricsSchema>;
export type TweetPreview = z.infer<typeof TweetPreviewSchema>;
export type AnalyzeTweetResponse = z.infer<typeof AnalyzeTweetResponseSchema>;
export type ExtensionSessionUser = z.infer<typeof ExtensionSessionUserSchema>;
export type ExtensionSessionStatus = z.infer<typeof ExtensionSessionStatusSchema>;
export type SavedAnalysis = z.infer<typeof SavedAnalysisSchema>;
export type SaveBookmarkInput = z.infer<typeof SaveBookmarkInputSchema>;
export type SavedBookmark = z.infer<typeof SavedBookmarkSchema>;
export type UpdateBookmarkTagsInput = z.infer<typeof UpdateBookmarkTagsInputSchema>;
export type DeleteBookmarkInput = z.infer<typeof DeleteBookmarkInputSchema>;
export type DeleteBookmarkResult = z.infer<typeof DeleteBookmarkResultSchema>;

export const LearningTrackTaskSetSchema = z.object({
	learn: z.string().min(1),
	explain: z.string().min(1),
	check: z.string().min(1),
});

export const LearningTrackDaySchema = z.object({
	day: z.number().int().min(1).max(7),
	title: z.string().min(1),
	focus: z.string().min(1),
	minutes: z.number().int().min(1),
	tasks: LearningTrackTaskSetSchema,
});

export const CreateLearningTrackInputSchema = z.object({
	analysisId: z.string().min(1),
});

export const CreateLearningTrackResultSchema = z.object({
	id: z.string().min(1),
	userId: z.string().min(1),
	analysisId: z.string().min(1),
	minutesPerDay: z.number().int().min(1),
	days: z.array(LearningTrackDaySchema).length(7),
	createdAt: z.number().int().nonnegative(),
});

export type CreateLearningTrackInput = z.infer<typeof CreateLearningTrackInputSchema>;
export type CreateLearningTrackResult = z.infer<typeof CreateLearningTrackResultSchema>;
