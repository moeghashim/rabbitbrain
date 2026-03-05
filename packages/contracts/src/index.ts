import { z } from "zod";

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

export const SavedAnalysisSchema = AnalyzeTweetResultSchema.extend({
	id: z.string().min(1),
	userId: z.string().min(1),
	tweetUrlOrId: z.string().min(1),
	model: z.string().min(1),
	createdAt: z.number().int().nonnegative(),
});

export const BookmarkTagSchema = z.string().min(1).max(24);

const BookmarkTagsSchema = z
	.array(BookmarkTagSchema)
	.min(1)
	.max(8)
	.refine(
		(tags) => {
			const normalized = new Set<string>();
			for (const tag of tags) {
				const key = tag.toLowerCase();
				if (normalized.has(key)) {
					return false;
				}
				normalized.add(key);
			}
			return true;
		},
		{
			message: "tags must be unique (case-insensitive)",
		},
	);

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
