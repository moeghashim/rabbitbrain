import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { GET as getBookmarkSyncCron } from "../app/api/internal/bookmarks/sync/route.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const vercelConfigPath = join(testDir, "../../../vercel.json");

test("vercel cron config schedules daily bookmark sync", () => {
	const vercelConfig = JSON.parse(readFileSync(vercelConfigPath, "utf8")) as {
		crons?: Array<{ path?: string; schedule?: string }>;
	};
	const bookmarkSyncCron = vercelConfig.crons?.find((cron) => cron.path === "/api/internal/bookmarks/sync");

	assert.deepEqual(bookmarkSyncCron, {
		path: "/api/internal/bookmarks/sync",
		schedule: "0 8 * * *",
	});
});

test("GET /api/internal/bookmarks/sync requires cron authorization when configured", async () => {
	const originalCronSecret = process.env.CRON_SECRET;
	process.env.CRON_SECRET = "test-secret";
	try {
		const response = await getBookmarkSyncCron(new Request("http://localhost/api/internal/bookmarks/sync"));
		assert.equal(response.status, 401);
		assert.deepEqual(await response.json(), {
			error: {
				message: "Unauthorized",
			},
		});
	} finally {
		if (originalCronSecret === undefined) {
			delete process.env.CRON_SECRET;
		} else {
			process.env.CRON_SECRET = originalCronSecret;
		}
	}
});
