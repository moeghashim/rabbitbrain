import type { SavedBookmark } from "@pi-starter/contracts";
import { XUserOAuthClient } from "@pi-starter/x-client";

import { isBookmarkAlreadyExistsError } from "./errors.js";
import { suggestBookmarkTags } from "./suggest-tags.js";
import {
	type XAccountCredentialRecord,
	getXAccountCredentialByUserId,
	listBookmarksForSession,
	listDueBookmarkSyncJobs,
	listFollowsForSession,
	saveBookmarkForSession,
	upsertBookmarkSyncStatusForSession,
	upsertXAccountCredentialForSession,
} from "../server/convex-admin.js";

interface SessionUserIdentity {
	id: string;
	email?: string | null;
	name?: string | null;
}

interface RefreshedTokenPayload {
	access_token: string;
	refresh_token?: string;
	token_type?: string;
	scope?: string;
	expires_in?: number;
}

function buildTweetUrl(authorUsername: string | undefined, tweetId: string): string {
	const username = authorUsername?.trim().replace(/^@+/, "");
	return username ? `https://x.com/${username}/status/${tweetId}` : `https://x.com/i/web/status/${tweetId}`;
}

async function refreshXAccessToken(record: XAccountCredentialRecord): Promise<RefreshedTokenPayload> {
	const clientId = process.env.AUTH_X_ID?.trim();
	if (!clientId || !record.refreshToken) {
		throw new Error("X account refresh token is unavailable.");
	}

	const response = await fetch("https://api.x.com/2/oauth2/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			refresh_token: record.refreshToken,
			grant_type: "refresh_token",
			client_id: clientId,
		}).toString(),
	});
	const payload = (await response.json()) as Partial<RefreshedTokenPayload> & { error?: string; error_description?: string };
	if (!response.ok || !payload.access_token) {
		throw new Error(payload.error_description ?? payload.error ?? "Unable to refresh X access token.");
	}
	return {
		access_token: payload.access_token,
		refresh_token: payload.refresh_token,
		token_type: payload.token_type,
		scope: payload.scope,
		expires_in: payload.expires_in,
	};
}

async function resolveAccessTokenForSync({
	record,
	sessionUser,
}: {
	record: XAccountCredentialRecord;
	sessionUser: SessionUserIdentity;
}): Promise<string> {
	if (!record.expiresAt || record.expiresAt > Date.now() + 60_000) {
		return record.accessToken;
	}

	const refreshed = await refreshXAccessToken(record);
	const nextExpiresAt = typeof refreshed.expires_in === "number" ? Date.now() + refreshed.expires_in * 1000 : undefined;
	await upsertXAccountCredentialForSession({
		sessionUser,
		xUserId: record.xUserId,
		accessToken: refreshed.access_token,
		refreshToken: refreshed.refresh_token ?? record.refreshToken,
		tokenType: refreshed.token_type ?? record.tokenType,
		scope: refreshed.scope ?? record.scope,
		expiresAt: nextExpiresAt,
	});
	return refreshed.access_token;
}

export async function syncXBookmarksForUser({
	userId,
	xUserId,
}: {
	userId: string;
	xUserId: string;
}): Promise<{ importedCount: number }> {
	const credential = await getXAccountCredentialByUserId({ userId });
	if (!credential) {
		return { importedCount: 0 };
	}

	const sessionUser = { id: xUserId };
	const accessToken = await resolveAccessTokenForSync({ record: credential, sessionUser });
	const [existingBookmarks, followSummary] = await Promise.all([
		listBookmarksForSession({ sessionUser }),
		listFollowsForSession({ sessionUser }),
	]);
	const knownTweetIds = new Set(existingBookmarks.map((bookmark) => bookmark.tweetId));
	const xClient = new XUserOAuthClient({ accessToken });

	let nextToken: string | undefined;
	let importedCount = 0;
	const importedBookmarks: SavedBookmark[] = [];

	do {
		const page = await xClient.getBookmarkedPostsByUserId(xUserId, 100, nextToken);
		for (const tweet of page.tweets) {
			if (knownTweetIds.has(tweet.id)) {
				continue;
			}
			const suggestedTags = suggestBookmarkTags({
				text: tweet.text,
				authorUsername: tweet.authorUsername,
				existingBookmarks: [...existingBookmarks, ...importedBookmarks],
				subjectFollows: followSummary.subjectFollows,
			});

			try {
				const saved = await saveBookmarkForSession({
					sessionUser,
					input: {
						tweetId: tweet.id,
						tweetText: tweet.text,
						tweetUrlOrId: buildTweetUrl(tweet.authorUsername, tweet.id),
						authorUsername: tweet.authorUsername ?? "unknown",
						authorName: tweet.authorName,
						authorAvatarUrl: tweet.authorAvatarUrl,
						tags: suggestedTags.length > 0 ? suggestedTags : ["Inbox"],
						source: "x_sync",
						importedAt: Date.now(),
						systemSuggestedTags: suggestedTags.length > 0 ? suggestedTags : ["Inbox"],
					},
				});
				knownTweetIds.add(saved.tweetId);
				importedBookmarks.push(saved);
				importedCount += 1;
			} catch (error) {
				if (isBookmarkAlreadyExistsError(error)) {
					continue;
				}
				throw error;
			}
		}
		nextToken = page.nextToken;
	} while (nextToken);

	await upsertBookmarkSyncStatusForSession({
		sessionUser,
		lastSyncedAt: Date.now(),
		lastError: undefined,
		importedCount,
		cursor: undefined,
	});

	return { importedCount };
}

export async function syncDueXBookmarks({
	limit = 20,
	now = () => Date.now(),
}: {
	limit?: number;
	now?: () => number;
}) {
	const startOfDay = new Date(now());
	startOfDay.setUTCHours(0, 0, 0, 0);
	const jobs = await listDueBookmarkSyncJobs({
		beforeTimestamp: startOfDay.getTime(),
		limit,
	});

	const results = [];
	for (const job of jobs) {
		try {
			const result = await syncXBookmarksForUser({
				userId: job.userId,
				xUserId: job.xUserId,
			});
			results.push({
				userId: job.userId,
				xUserId: job.xUserId,
				importedCount: result.importedCount,
				ok: true,
			});
		} catch (error) {
			await upsertBookmarkSyncStatusForSession({
				sessionUser: { id: job.xUserId },
				lastSyncedAt: job.lastSyncedAt,
				lastError: error instanceof Error ? error.message : "Unable to sync X bookmarks.",
				importedCount: 0,
			});
			results.push({
				userId: job.userId,
				xUserId: job.xUserId,
				importedCount: 0,
				ok: false,
				error: error instanceof Error ? error.message : "Unable to sync X bookmarks.",
			});
		}
	}

	return results;
}
