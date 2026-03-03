import {
	type DataModelFromSchemaDefinition,
	type GenericMutationCtx,
	type GenericQueryCtx,
} from "convex/server";

import schema from "./schema.js";

type AppDataModel = DataModelFromSchemaDefinition<typeof schema>;
type ConvexContext = GenericQueryCtx<AppDataModel> | GenericMutationCtx<AppDataModel>;

export interface ConvexIdentity {
	subject: string;
	email?: string;
	name?: string;
}

function assertValidSubject(identity: ConvexIdentity): string {
	const subject = identity.subject?.trim();
	if (!subject) {
		throw new Error("Unauthorized");
	}
	return subject;
}

export async function requireIdentity(ctx: { auth: { getUserIdentity: () => Promise<ConvexIdentity | null> } }) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Unauthorized");
	}
	assertValidSubject(identity);
	return identity;
}

export async function requireUserBySession(ctx: ConvexContext) {
	const identity = await requireIdentity(ctx);
	const user = await ctx.db
		.query("users")
		.withIndex("by_x_user_id", (query) => query.eq("xUserId", identity.subject))
		.unique();
	if (!user) {
		throw new Error("User not found");
	}
	return user;
}
