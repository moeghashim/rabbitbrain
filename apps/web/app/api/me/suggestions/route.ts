import { NextResponse } from "next/server";

import { getServerAuthSession } from "../../../../src/auth/auth.js";
import { validateStartupEnvIfNeeded } from "../../../../src/config/startup-env.js";
import {
	buildSuggestionsForSession,
	listRenderableSuggestionsForSession,
} from "../../../../src/suggestions/build-suggestions.js";
import { reportServerError } from "../../../../src/telemetry/report-error.js";

interface SessionUserLike {
	id?: string | null;
	email?: string | null;
	name?: string | null;
}

interface SessionLike {
	user?: SessionUserLike | null;
}

interface AuthenticatedSessionUser {
	id: string;
	email?: string | null;
	name?: string | null;
}

interface SuggestionsRouteDependencies {
	validateStartupEnvIfNeeded: () => void;
	getServerAuthSession: () => Promise<SessionLike | null>;
	buildSuggestionsForSession: typeof buildSuggestionsForSession;
	listRenderableSuggestionsForSession: typeof listRenderableSuggestionsForSession;
	reportServerError: typeof reportServerError;
}

const defaultDependencies: SuggestionsRouteDependencies = {
	validateStartupEnvIfNeeded,
	getServerAuthSession,
	buildSuggestionsForSession,
	listRenderableSuggestionsForSession,
	reportServerError,
};

function readSessionUser(session: SessionLike | null): AuthenticatedSessionUser | null {
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

export async function handleSuggestionsGet(
	_request: Request,
	_context?: unknown,
	dependencies: SuggestionsRouteDependencies = defaultDependencies,
) {
	try {
		dependencies.validateStartupEnvIfNeeded();
		const sessionUser = readSessionUser(await dependencies.getServerAuthSession());
		if (!sessionUser) {
			return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
		}

		try {
			return NextResponse.json(await dependencies.buildSuggestionsForSession({ sessionUser }));
		} catch (error) {
			dependencies.reportServerError({
				scope: "api.suggestions.refresh_failure",
				error,
			});
			return NextResponse.json(await dependencies.listRenderableSuggestionsForSession({ sessionUser }));
		}
	} catch (error) {
		dependencies.reportServerError({
			scope: "api.suggestions.get_failure",
			error,
		});
		return NextResponse.json(
			{ error: { message: error instanceof Error ? error.message : "Unable to load suggestions." } },
			{ status: 500 },
		);
	}
}

export async function GET(request: Request, context?: unknown) {
	return handleSuggestionsGet(request, context);
}
