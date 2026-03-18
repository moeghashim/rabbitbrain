import { NextResponse } from "next/server";

import { getServerAuthSession } from "../../../../src/auth/auth.js";
import { validateStartupEnvIfNeeded } from "../../../../src/config/startup-env.js";
import { listFollowingFeedForSession } from "../../../../src/server/convex-admin.js";
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

interface FollowingFeedRouteDependencies {
	validateStartupEnvIfNeeded: () => void;
	getServerAuthSession: () => Promise<SessionLike | null>;
	listFollowingFeedForSession: typeof listFollowingFeedForSession;
	reportServerError: typeof reportServerError;
}

const defaultDependencies: FollowingFeedRouteDependencies = {
	validateStartupEnvIfNeeded,
	getServerAuthSession,
	listFollowingFeedForSession,
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

export async function handleFollowingFeedGet(
	_request: Request,
	_context?: unknown,
	dependencies: FollowingFeedRouteDependencies = defaultDependencies,
) {
	try {
		dependencies.validateStartupEnvIfNeeded();
		const sessionUser = readSessionUser(await dependencies.getServerAuthSession());
		if (!sessionUser) {
			return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
		}

		const response = await dependencies.listFollowingFeedForSession({
			sessionUser,
		});
		return NextResponse.json(response);
	} catch (error) {
		dependencies.reportServerError({
			scope: "api.following_feed.get_failure",
			error,
		});
		return NextResponse.json(
			{ error: { message: error instanceof Error ? error.message : "Unable to load following feed." } },
			{ status: 500 },
		);
	}
}

export const GET = handleFollowingFeedGet;
