import { NextResponse } from "next/server";

import { reportServerError } from "../../../../../src/telemetry/report-error.js";
import { syncDueXBookmarks } from "../../../../../src/bookmarks/sync-x-bookmarks.js";

export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
	const cronSecret = process.env.CRON_SECRET?.trim();
	if (!cronSecret) {
		return true;
	}

	return req.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function POST(req: Request) {
	if (!isAuthorized(req)) {
		return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
	}

	try {
		const results = await syncDueXBookmarks({});
		return NextResponse.json({ results });
	} catch (error) {
		reportServerError({
			scope: "api.bookmark_sync.cron_failure",
			error,
		});
		return NextResponse.json(
			{ error: { message: error instanceof Error ? error.message : "Unable to sync X bookmarks." } },
			{ status: 500 },
		);
	}
}
