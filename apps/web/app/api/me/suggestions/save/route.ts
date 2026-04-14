import { SaveSuggestionInputSchema } from "@pi-starter/contracts";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { isBookmarkAlreadyExistsError } from "../../../../../src/bookmarks/errors.js";
import { getServerAuthSession } from "../../../../../src/auth/auth.js";
import { validateStartupEnvIfNeeded } from "../../../../../src/config/startup-env.js";
import {
	getSuggestionByIdForSession,
	recordSuggestionFeedbackForSession,
	saveBookmarkForSession,
} from "../../../../../src/server/convex-admin.js";
import { buildSuggestionsForSession } from "../../../../../src/suggestions/build-suggestions.js";
import { reportServerError } from "../../../../../src/telemetry/report-error.js";

interface SessionUserLike {
	id?: string | null;
	email?: string | null;
	name?: string | null;
}

interface SessionLike {
	user?: SessionUserLike | null;
}

function readSessionUser(session: SessionLike | null) {
	const user = session?.user;
	const id = user?.id?.trim() ?? "";
	if (!user || !id) {
		return null;
	}
	return {
		id,
		email: user.email,
		name: user.name,
	};
}

export async function POST(req: Request) {
	try {
		validateStartupEnvIfNeeded();
		const sessionUser = readSessionUser(await getServerAuthSession());
		if (!sessionUser) {
			return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
		}

		const input = SaveSuggestionInputSchema.parse(await req.json());
		const suggestion = await getSuggestionByIdForSession({
			sessionUser,
			suggestionId: input.suggestionId,
		});
		if (!suggestion) {
			return NextResponse.json({ error: { message: "Suggestion not found" } }, { status: 404 });
		}

		try {
			await saveBookmarkForSession({
				sessionUser,
				input: {
					tweetId: suggestion.tweetId,
					tweetText: suggestion.tweetText,
					tweetUrlOrId: suggestion.tweetUrlOrId,
					authorUsername: suggestion.authorUsername,
					authorName: suggestion.authorName,
					authorAvatarUrl: suggestion.authorAvatarUrl,
					tags: suggestion.suggestedTags.length > 0 ? suggestion.suggestedTags : ["Inbox"],
					source: "suggestion",
					systemSuggestedTags: suggestion.suggestedTags.length > 0 ? suggestion.suggestedTags : ["Inbox"],
				},
			});
		} catch (error) {
			if (!isBookmarkAlreadyExistsError(error)) {
				throw error;
			}
		}

		await recordSuggestionFeedbackForSession({
			sessionUser,
			suggestionId: input.suggestionId,
			status: "saved",
		});

		return NextResponse.json({
			suggestion,
			...(await buildSuggestionsForSession({ sessionUser })),
		});
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json(
				{ error: { message: error.issues[0]?.message ?? "Invalid save suggestion input." } },
				{ status: 400 },
			);
		}
		reportServerError({
			scope: "api.suggestions.save_failure",
			error,
		});
		return NextResponse.json(
			{ error: { message: error instanceof Error ? error.message : "Unable to save suggestion." } },
			{ status: 500 },
		);
	}
}
