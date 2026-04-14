import { DismissSuggestionInputSchema } from "@pi-starter/contracts";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getServerAuthSession } from "../../../../../src/auth/auth.js";
import { validateStartupEnvIfNeeded } from "../../../../../src/config/startup-env.js";
import { recordSuggestionFeedbackForSession } from "../../../../../src/server/convex-admin.js";
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

		const input = DismissSuggestionInputSchema.parse(await req.json());
		await recordSuggestionFeedbackForSession({
			sessionUser,
			suggestionId: input.suggestionId,
			status: "dismissed",
		});

		return NextResponse.json(await buildSuggestionsForSession({ sessionUser }));
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json(
				{ error: { message: error.issues[0]?.message ?? "Invalid dismiss suggestion input." } },
				{ status: 400 },
			);
		}
		reportServerError({
			scope: "api.suggestions.dismiss_failure",
			error,
		});
		return NextResponse.json(
			{ error: { message: error instanceof Error ? error.message : "Unable to dismiss suggestion." } },
			{ status: 500 },
		);
	}
}
