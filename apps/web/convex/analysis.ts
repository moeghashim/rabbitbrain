import { SavedAnalysisSchema } from "@pi-starter/contracts";
import { XApiV2Client } from "@pi-starter/x-client";
import {
	mutationGeneric,
	queryGeneric,
	type DataModelFromSchemaDefinition,
	type GenericMutationCtx,
	type GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";

import { buildAnalysisFromTweetPayload } from "../src/analysis/build-analysis.js";
import schema from "./schema.js";

type AppDataModel = DataModelFromSchemaDefinition<typeof schema>;
type QueryContext = GenericQueryCtx<AppDataModel>;
type MutationContext = GenericMutationCtx<AppDataModel>;
type ConvexContext = QueryContext | MutationContext;

interface ConvexIdentity {
	subject: string;
}

async function requireUser(ctx: ConvexContext) {
	const identity = (await ctx.auth.getUserIdentity()) as ConvexIdentity | null;
	if (!identity) {
		throw new Error("Unauthorized");
	}
	const user = await ctx.db
		.query("users")
		.withIndex("by_clerk_user_id", (query) => query.eq("clerkUserId", identity.subject))
		.unique();
	if (!user) {
		throw new Error("User not found");
	}
	return user;
}

export const createFromTweetUrl = mutationGeneric({
	args: {
		tweetUrlOrId: v.string(),
		model: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
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
	},
});

export const listByUser = queryGeneric({
	args: {},
	handler: async (ctx) => {
		const user = await requireUser(ctx);
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
