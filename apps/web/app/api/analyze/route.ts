import {
	AnalyzeTweetInputSchema,
	type AnalyzeTweetInput,
} from "@pi-starter/contracts";
import { XApiV2Client, XProviderError } from "@pi-starter/x-client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { buildResumeSignInRedirect, mapXErrorCodeToResponse } from "../../../src/analyze/analyze-route-helpers.js";
import { getServerAuthSession } from "../../../src/auth/auth.js";
import { validateStartupEnvIfNeeded } from "../../../src/config/startup-env.js";
import { persistAnalysisForSession } from "../../../src/server/convex-admin.js";
import { reportServerError } from "../../../src/telemetry/report-error.js";

async function readAnalyzeInput(req: Request): Promise<AnalyzeTweetInput> {
	const contentType = req.headers.get("content-type") ?? "";
	if (contentType.includes("application/json")) {
		return AnalyzeTweetInputSchema.parse(await req.json());
	}

	const formData = await req.formData();
	const tweetUrlOrId = formData.get("tweetUrlOrId");
	const model = formData.get("model");
	return AnalyzeTweetInputSchema.parse({
		tweetUrlOrId: typeof tweetUrlOrId === "string" ? tweetUrlOrId : "",
		model: typeof model === "string" && model.trim().length > 0 ? model : undefined,
	});
}

export async function POST(req: Request) {
	try {
		validateStartupEnvIfNeeded();
		const input = await readAnalyzeInput(req);
		const session = await getServerAuthSession();
		const sessionUser = session?.user;
		const userId = session?.user?.id?.trim() ?? "";

		if (!userId || !sessionUser) {
			return NextResponse.json(
				{
					error: {
						code: "AUTH_REQUIRED",
						message: "Sign in with Twitter to analyze tweets.",
					},
					redirectTo: buildResumeSignInRedirect(input.tweetUrlOrId),
				},
				{ status: 401 },
			);
		}

		const client = new XApiV2Client();
		const tweet = await client.getTweetByUrlOrId(input.tweetUrlOrId);
		const persisted = await persistAnalysisForSession({
			sessionUser: {
				id: userId,
				email: sessionUser.email,
				name: sessionUser.name,
			},
			input,
			tweet,
		});

		return NextResponse.json({
			tweet: {
				id: tweet.id,
				text: tweet.text,
				authorId: tweet.authorId,
				authorUsername: tweet.authorUsername,
				authorName: tweet.authorName,
				authorAvatarUrl: tweet.authorAvatarUrl,
			},
			analysis: {
				topic: persisted.topic,
				summary: persisted.summary,
				intent: persisted.intent,
				novelConcepts: persisted.novelConcepts,
			},
		});
	} catch (error) {
		if (error instanceof ZodError) {
			reportServerError({
				scope: "api.analyze.invalid_input",
				error,
			});
			return NextResponse.json(
				{
					error: {
						code: "INVALID_INPUT",
						message: error.issues[0]?.message ?? "Invalid analyze input.",
					},
				},
				{ status: 400 },
			);
		}

		if (error instanceof XProviderError) {
			reportServerError({
				scope: "api.analyze.x_provider_error",
				error,
				metadata: {
					code: error.code,
					retryable: error.retryable,
				},
			});
			const mapped = mapXErrorCodeToResponse(error.code);
			return NextResponse.json(mapped.body, { status: mapped.status });
		}

		reportServerError({
			scope: "api.analyze.unexpected_failure",
			error,
		});

		return NextResponse.json(
			{
				error: {
					code: "ANALYSIS_FAILED",
					message: error instanceof Error ? error.message : "Unexpected analysis failure.",
				},
			},
			{ status: 500 },
		);
	}
}
