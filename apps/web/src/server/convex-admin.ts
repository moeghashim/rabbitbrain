import {
	type AnalyzeTweetInput,
	SavedAnalysisSchema,
	type SavedAnalysis,
} from "@pi-starter/contracts";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

interface SessionUserIdentity {
	id: string;
	email?: string | null;
	name?: string | null;
}

interface ConvexActingIdentity {
	subject: string;
	issuer: string;
	tokenIdentifier: string;
	email?: string;
	name?: string;
}

interface ConvexHttpClientWithAdminAuth extends ConvexHttpClient {
	setAdminAuth(token: string, actingAsIdentity?: ConvexActingIdentity): void;
}

interface ConvexEnv {
	[key: string]: string | undefined;
	NEXT_PUBLIC_CONVEX_URL?: string;
	CONVEX_DEPLOY_KEY?: string;
}

const upsertCurrentUserRef = makeFunctionReference<
	"mutation",
	{ email?: string; name?: string },
	string
>("users:upsertCurrentUser");

const createFromTweetUrlRef = makeFunctionReference<
	"mutation",
	{
		tweetUrlOrId: string;
		model?: string;
	},
	SavedAnalysis
>("analysis:createFromTweetUrl");

function readRequiredEnv(name: keyof ConvexEnv, env: ConvexEnv): string {
	const value = env[name];
	if (!value || value.trim().length === 0) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value.trim();
}

function createActingIdentity(user: SessionUserIdentity): ConvexActingIdentity {
	const issuer = "https://rabbitbrain.app/authjs";
	return {
		subject: user.id,
		issuer,
		tokenIdentifier: `${issuer}|${user.id}`,
		email: user.email ?? undefined,
		name: user.name ?? undefined,
	};
}

function createAdminClient({ user, env = process.env }: { user: SessionUserIdentity; env?: ConvexEnv }): ConvexHttpClient {
	const convexUrl = readRequiredEnv("NEXT_PUBLIC_CONVEX_URL", env);
	const deployKey = readRequiredEnv("CONVEX_DEPLOY_KEY", env);
	const client = new ConvexHttpClient(convexUrl);
	const clientWithAdminAuth = client as ConvexHttpClientWithAdminAuth;
	clientWithAdminAuth.setAdminAuth(deployKey, createActingIdentity(user));
	return client;
}

export async function persistAnalysisForSession({
	sessionUser,
	input,
	env,
}: {
	sessionUser: SessionUserIdentity;
	input: AnalyzeTweetInput;
	env?: ConvexEnv;
}): Promise<SavedAnalysis> {
	const userId = sessionUser.id.trim();
	if (!userId) {
		throw new Error("Unauthorized");
	}

	const client = createAdminClient({
		user: {
			...sessionUser,
			id: userId,
		},
		env,
	});

	await client.mutation(upsertCurrentUserRef, {
		email: sessionUser.email ?? undefined,
		name: sessionUser.name ?? undefined,
	});

	const saved = await client.mutation(createFromTweetUrlRef, {
		tweetUrlOrId: input.tweetUrlOrId,
		model: input.model,
	});

	return SavedAnalysisSchema.parse(saved);
}
