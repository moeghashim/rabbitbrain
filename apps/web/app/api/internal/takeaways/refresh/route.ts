import { NextResponse } from "next/server";

import { validateStartupEnvIfNeeded } from "../../../../../src/config/startup-env.js";
import { listDueTakeawayRefreshJobs } from "../../../../../src/server/convex-admin.js";
import { buildTakeawayDateKey, refreshTakeawayForSession } from "../../../../../src/takeaways/refresh-takeaway.js";
import { reportServerError } from "../../../../../src/telemetry/report-error.js";

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
		validateStartupEnvIfNeeded();
		const now = Date.now();
		const dateKey = buildTakeawayDateKey(now);
		const jobs = await listDueTakeawayRefreshJobs({
			dateKey,
			limit: 100,
		});

		const results = [];
		for (const job of jobs) {
			try {
				const refreshed = await refreshTakeawayForSession({
					sessionUser: {
						id: job.userId,
					},
					followId: job.followId,
					now: () => now,
				});
				results.push({
					followId: job.followId,
					accountUsername: job.accountUsername,
					ok: true,
					deduped: refreshed.deduped,
				});
			} catch (error) {
				reportServerError({
					scope: "api.takeaways.cron_job_failure",
					error,
					metadata: {
						followId: job.followId,
						accountUsername: job.accountUsername,
					},
				});
				results.push({
					followId: job.followId,
					accountUsername: job.accountUsername,
					ok: false,
					error: error instanceof Error ? error.message : "Unknown refresh failure.",
				});
			}
		}

		return NextResponse.json({
			dateKey,
			count: jobs.length,
			results,
		});
	} catch (error) {
		reportServerError({
			scope: "api.takeaways.cron_failure",
			error,
		});
		return NextResponse.json(
			{ error: { message: error instanceof Error ? error.message : "Unable to run takeaway refresh cron." } },
			{ status: 500 },
		);
	}
}
