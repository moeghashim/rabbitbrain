import { NextResponse } from "next/server";

import { getServerAuthSession } from "../../../../src/auth/auth.js";
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

export async function GET() {
	try {
		validateStartupEnvIfNeeded();
		const sessionUser = readSessionUser(await getServerAuthSession());
		if (!sessionUser) {
			return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
		}

		return NextResponse.json(await getBookmarkSyncStatusForSession({ sessionUser }));
	} catch (error) {
		reportServerError({
			scope: "api.bookmark_sync.get_failure",
			error,
		});
		return NextResponse.json(
			{ error: { message: error instanceof Error ? error.message : "Unable to load bookmark sync status." } },
			{ status: 500 },
		);
	}
}
