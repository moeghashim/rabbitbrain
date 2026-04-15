import { NextResponse } from "next/server";

import { getServerAuthSession } from "../../../../src/auth/auth.js";
import { syncXBookmarksForSession } from "../../../../src/bookmarks/sync-x-bookmarks.js";
import { validateStartupEnvIfNeeded } from "../../../../src/config/startup-env.js";
import { getBookmarkSyncStatusForSession } from "../../../../src/server/convex-admin.js";
import { reportServerError } from "../../../../src/telemetry/report-error.js";

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

interface BookmarkSyncRouteDependencies {
	validateStartupEnvIfNeeded: () => void;
	getServerAuthSession: () => Promise<SessionLike | null>;
	getBookmarkSyncStatusForSession: typeof getBookmarkSyncStatusForSession;
	syncXBookmarksForSession: typeof syncXBookmarksForSession;
	reportServerError: typeof reportServerError;
}

function createDefaultDependencies(): BookmarkSyncRouteDependencies {
	return {
		validateStartupEnvIfNeeded,
		getServerAuthSession,
		getBookmarkSyncStatusForSession,
		syncXBookmarksForSession,
		reportServerError,
	};
}

export async function handleBookmarkSyncGet(dependencies: BookmarkSyncRouteDependencies = createDefaultDependencies()) {
	try {
		dependencies.validateStartupEnvIfNeeded();
		const sessionUser = readSessionUser(await dependencies.getServerAuthSession());
		if (!sessionUser) {
			return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
		}

		return NextResponse.json(await dependencies.getBookmarkSyncStatusForSession({ sessionUser }));
	} catch (error) {
		dependencies.reportServerError({
			scope: "api.bookmark_sync.get_failure",
			error,
		});
		return NextResponse.json(
			{ error: { message: error instanceof Error ? error.message : "Unable to load bookmark sync status." } },
			{ status: 500 },
		);
	}
}

export async function handleBookmarkSyncPost(dependencies: BookmarkSyncRouteDependencies = createDefaultDependencies()) {
	try {
		dependencies.validateStartupEnvIfNeeded();
		const sessionUser = readSessionUser(await dependencies.getServerAuthSession());
		if (!sessionUser) {
			return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
		}

		const result = await dependencies.syncXBookmarksForSession({ sessionUser });
		const status = await dependencies.getBookmarkSyncStatusForSession({ sessionUser });
		return NextResponse.json({
			...result,
			state: status.state,
		});
	} catch (error) {
		dependencies.reportServerError({
			scope: "api.bookmark_sync.post_failure",
			error,
		});
		return NextResponse.json(
			{ error: { message: error instanceof Error ? error.message : "Unable to sync X bookmarks." } },
			{ status: 500 },
		);
	}
}

export async function GET() {
	return handleBookmarkSyncGet();
}

export async function POST() {
	return handleBookmarkSyncPost();
}
