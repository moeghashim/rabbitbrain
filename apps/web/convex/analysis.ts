import { SavedAnalysisSchema } from "@pi-starter/contracts";
import { XApiV2Client } from "@pi-starter/x-client";
import {
	mutationGeneric,
	queryGeneric,
} from "convex/server";
import { v } from "convex/values";

import { buildAnalysisFromTweetPayload } from "../src/analysis/build-analysis.js";
import { reportServerError } from "../src/telemetry/report-error.js";
import { requireUserBySession } from "./auth-helpers.js";

export const createFromTweetUrl = mutationGeneric({
	args: {
		tweetUrlOrId: v.string(),
		model: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		try {
			const user = await requireUserBySession(ctx);
			const client = new XApiV2Client();
			const tweet = await client.getTweetByUrlOrId(args.tweetUrlOrId);
			const analysis = buildAnalysisFromTweetPayload(tweet);
			const createdAt = Date.now();

			const id = await ctx.db.insert("analyses", {
				userId: user._id,
				tweetUrlOrId: args.tweetUrlOrId,
				model: args.model ?? "gpt-4.1",
				topic: analysis.topic,
				summary: analysis.summary,
				intent: analysis.intent,
				novelConcepts: analysis.novelConcepts,
				createdAt,
			});

			return SavedAnalysisSchema.parse({
				id: String(id),
				userId: String(user._id),
				tweetUrlOrId: args.tweetUrlOrId,
				model: args.model ?? "gpt-4.1",
				topic: analysis.topic,
				summary: analysis.summary,
				intent: analysis.intent,
				novelConcepts: analysis.novelConcepts,
				createdAt,
			});
		} catch (error) {
			reportServerError({
				scope: "analysis.createFromTweetUrl",
				error,
				metadata: {
					hasModelOverride: Boolean(args.model),
				},
			});
			throw error;
		}
	},
});

export const listByUser = queryGeneric({
	args: {},
	handler: async (ctx) => {
		const user = await requireUserBySession(ctx);
		const records = await ctx.db
			.query("analyses")
			.withIndex("by_user_id_created_at", (query) => query.eq("userId", user._id))
			.collect();

		return records
			.sort((left, right) => right.createdAt - left.createdAt)
			.map((item) =>
				SavedAnalysisSchema.parse({
					id: String(item._id),
					userId: String(item.userId),
					tweetUrlOrId: item.tweetUrlOrId,
					model: item.model,
					topic: item.topic,
					summary: item.summary,
					intent: item.intent,
					novelConcepts: item.novelConcepts,
					createdAt: item.createdAt,
				}),
			);
	},
});
