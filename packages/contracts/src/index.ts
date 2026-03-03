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

export type AnalyzeTweetInput = z.infer<typeof AnalyzeTweetInputSchema>;
export type AnalyzeTweetResult = z.infer<typeof AnalyzeTweetResultSchema>;
export type SavedAnalysis = z.infer<typeof SavedAnalysisSchema>;
