import { NextResponse } from "next/server";

import { getServerAuthSession } from "../../../../src/auth/auth.js";
import { listFollowingFeedForSession } from "../../../../src/server/convex-admin.js";

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
	getServerAuthSession: () => Promise<SessionLike | null>;
	listFollowingFeedForSession: typeof listFollowingFeedForSession;
}

const defaultDependencies: FollowingFeedRouteDependencies = {
	getServerAuthSession,
	listFollowingFeedForSession,
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
	dependencies: FollowingFeedRouteDependencies = defaultDependencies,
) {
	const sessionUser = readSessionUser(await dependencies.getServerAuthSession());
	if (!sessionUser) {
		return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
	}

	const response = await dependencies.listFollowingFeedForSession({
		sessionUser,
	});
	return NextResponse.json(response);
}

export const GET = handleFollowingFeedGet;
