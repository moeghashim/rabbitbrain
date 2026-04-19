import assert from "node:assert/strict";
import test from "node:test";

import {
	INITIAL_BACKFILL_PAGE_LIMIT,
	INCREMENTAL_PAGE_LIMIT,
	buildXTokenRefreshRequest,
	isFullyKnownBookmarkPage,
	resolveBookmarkSyncMode,
	resolveBookmarkSyncPageLimit,
} from "../src/bookmarks/sync-x-bookmarks.js";

test("resolveBookmarkSyncMode defaults to initial backfill without prior state", () => {
	assert.equal(resolveBookmarkSyncMode(), "initial_backfill");
});

test("resolveBookmarkSyncMode keeps initial backfill until history is complete", () => {
	assert.equal(
		resolveBookmarkSyncMode({
			mode: "initial_backfill",
			backfillComplete: false,
		}),
		"initial_backfill",
	);
});

test("resolveBookmarkSyncMode switches to incremental once backfill completed", () => {
	assert.equal(
		resolveBookmarkSyncMode({
			mode: "initial_backfill",
			backfillComplete: true,
		}),
		"incremental",
	);
});

test("resolveBookmarkSyncPageLimit uses tighter bounds for incremental sync", () => {
	assert.equal(resolveBookmarkSyncPageLimit("initial_backfill"), INITIAL_BACKFILL_PAGE_LIMIT);
	assert.equal(resolveBookmarkSyncPageLimit("incremental"), INCREMENTAL_PAGE_LIMIT);
});

test("isFullyKnownBookmarkPage returns true only when every tweet is already known", () => {
	const knownTweetIds = new Set(["tweet_1", "tweet_2", "tweet_3"]);

	assert.equal(isFullyKnownBookmarkPage(["tweet_1", "tweet_2"], knownTweetIds), true);
	assert.equal(isFullyKnownBookmarkPage(["tweet_1", "tweet_4"], knownTweetIds), false);
	assert.equal(isFullyKnownBookmarkPage([], knownTweetIds), false);
});

test("buildXTokenRefreshRequest sends client auth for token refresh", () => {
	const request = buildXTokenRefreshRequest({
		clientId: "x_client_id",
		clientSecret: "x_client_secret",
		refreshToken: "refresh_token",
	});

	assert.equal(request.method, "POST");
	assert.deepEqual(request.headers, {
		Authorization: "Basic eF9jbGllbnRfaWQ6eF9jbGllbnRfc2VjcmV0",
		"Content-Type": "application/x-www-form-urlencoded",
	});
	assert.equal(request.body, "refresh_token=refresh_token&grant_type=refresh_token&client_id=x_client_id");
});
