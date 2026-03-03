import {
	CreateLearningTrackResultSchema,
	SavedAnalysisSchema,
} from "@pi-starter/contracts";
import {
	mutationGeneric,
	queryGeneric,
	type DataModelFromSchemaDefinition,
	type GenericMutationCtx,
	type GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";

import { createTrackFromSavedAnalysis } from "../src/track/track-pipeline.js";
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

export const createFromAnalysis = mutationGeneric({
	args: {
		analysisId: v.id("analyses"),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		const analysisDoc = await ctx.db.get(args.analysisId);
		if (!analysisDoc) {
			throw new Error("Analysis not found");
		}
		if (String(analysisDoc.userId) !== String(user._id)) {
			throw new Error("Analysis does not belong to user");
		}

		const analysis = SavedAnalysisSchema.parse({
			id: String(analysisDoc._id),
			userId: String(analysisDoc.userId),
			tweetUrlOrId: analysisDoc.tweetUrlOrId,
			model: analysisDoc.model,
			topic: analysisDoc.topic,
			summary: analysisDoc.summary,
			intent: analysisDoc.intent,
			novelConcepts: analysisDoc.novelConcepts,
			createdAt: analysisDoc.createdAt,
		});

		const track = await createTrackFromSavedAnalysis({
			input: {
				analysisId: String(args.analysisId),
			},
			userId: String(user._id),
			analysis,
			storage: {
				async insert(record) {
					const id = await ctx.db.insert("learningTracks", {
						userId: user._id,
						analysisId: args.analysisId,
						minutesPerDay: record.minutesPerDay,
						days: record.days,
						createdAt: record.createdAt,
					});
					return CreateLearningTrackResultSchema.parse({
						id: String(id),
						...record,
					});
				},
				async listByUser() {
					return [];
				},
			},
		});

		return CreateLearningTrackResultSchema.parse(track);
	},
});

export const listByUser = queryGeneric({
	args: {},
	handler: async (ctx) => {
		const user = await requireUser(ctx);
		const records = await ctx.db
			.query("learningTracks")
			.withIndex("by_user_id_created_at", (query) => query.eq("userId", user._id))
			.collect();

		return records
			.sort((left, right) => right.createdAt - left.createdAt)
			.map((item) =>
				CreateLearningTrackResultSchema.parse({
					id: String(item._id),
					userId: String(item.userId),
					analysisId: String(item.analysisId),
					minutesPerDay: item.minutesPerDay,
					days: item.days,
					createdAt: item.createdAt,
				}),
			);
	},
});
