import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

interface ConvexIdentity {
	subject: string;
	email?: string;
	name?: string;
}

async function requireIdentity(ctx: { auth: { getUserIdentity: () => Promise<ConvexIdentity | null> } }) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Unauthorized");
	}
	return identity;
}

export const upsertCurrentUser = mutationGeneric({
	args: {
		email: v.optional(v.string()),
		name: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		const now = Date.now();
		const userEmail = args.email ?? identity.email;
		const userName = args.name ?? identity.name;
		const existing = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (query) => query.eq("clerkUserId", identity.subject))
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				email: userEmail,
				name: userName,
				updatedAt: now,
			});
			return existing._id;
		}

		return await ctx.db.insert("users", {
			clerkUserId: identity.subject,
			email: userEmail,
			name: userName,
			createdAt: now,
			updatedAt: now,
		});
	},
});
