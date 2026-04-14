import type { Suggestion } from "@pi-starter/contracts";
import { XApiV2Client, type TweetPayload } from "@pi-starter/x-client";

import { suggestBookmarkTags } from "../bookmarks/suggest-tags.js";
import {
	getTakeawayHistoryForSession,
	listBookmarksForSession,
	listDismissedSuggestionTweetIdsForSession,
	listFollowsForSession,
	listTakeawayWorkspaceForSession,
	upsertSuggestionsForSession,
} from "../server/convex-admin.js";

interface SessionUserIdentity {
	id: string;
	email?: string | null;
	name?: string | null;
}

interface Candidate {
	tweet: TweetPayload;
	reasons: Suggestion["reasons"];
	sourceSignals: string[];
}

function buildTweetUrl(tweet: TweetPayload): string {
	const username = tweet.authorUsername?.trim().replace(/^@+/, "");
	return username ? `https://x.com/${username}/status/${tweet.id}` : `https://x.com/i/web/status/${tweet.id}`;
}

function normalize(value: string): string {
	return value.trim().toLowerCase();
}

function deriveTopBookmarkTags(textTags: string[], limit: number): string[] {
	const counts = new Map<string, number>();
	for (const tag of textTags) {
		const key = normalize(tag);
		if (!key) {
			continue;
		}
		counts.set(tag, (counts.get(tag) ?? 0) + 1);
	}
	return Array.from(counts.entries())
		.sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], undefined, { sensitivity: "base" }))
		.slice(0, limit)
		.map(([tag]) => tag);
}

function mergeCandidate(map: Map<string, Candidate>, tweet: TweetPayload, nextReason: Suggestion["reasons"][number], signal: string) {
	const existing = map.get(tweet.id);
	if (!existing) {
		map.set(tweet.id, {
			tweet,
			reasons: [nextReason],
			sourceSignals: [signal],
		});
		return;
	}

	if (!existing.reasons.some((reason) => reason.code === nextReason.code && reason.label === nextReason.label)) {
		existing.reasons.push(nextReason);
	}
	if (!existing.sourceSignals.includes(signal)) {
		existing.sourceSignals.push(signal);
	}
}

function scoreCandidate({
	candidate,
	bookmarks,
	followedCreators,
}: {
	candidate: Candidate;
	bookmarks: Awaited<ReturnType<typeof listBookmarksForSession>>;
	followedCreators: Set<string>;
}): number {
	let score = 0;
	if (followedCreators.has(normalize(candidate.tweet.authorUsername ?? ""))) {
		score += 60;
	}

	const bookmarkTagMatches = new Set<string>();
	for (const bookmark of bookmarks) {
		const bookmarkText = normalize(bookmark.tweetText);
		const candidateText = normalize(candidate.tweet.text);
		if (bookmarkText && candidateText.includes(bookmarkText.slice(0, Math.min(bookmarkText.length, 48)))) {
			score += 6;
		}
		for (const tag of bookmark.tags) {
			if (normalize(candidate.tweet.text).includes(normalize(tag))) {
				bookmarkTagMatches.add(tag);
			}
		}
	}

	score += bookmarkTagMatches.size * 12;
	for (const reason of candidate.reasons) {
		if (reason.code === "subject_search") {
			score += 30;
		}
		if (reason.code === "bookmark_affinity") {
			score += 25;
		}
		if (reason.code === "takeaway_theme") {
			score += 8;
		}
	}

	return score;
}

export async function buildSuggestionsForSession({
	sessionUser,
	limit = 20,
}: {
	sessionUser: SessionUserIdentity;
	limit?: number;
}) {
	const [bookmarks, followSummary, takeawayWorkspace, dismissedTweetIds] = await Promise.all([
		listBookmarksForSession({ sessionUser }),
		listFollowsForSession({ sessionUser }),
		listTakeawayWorkspaceForSession({ sessionUser }),
		listDismissedSuggestionTweetIdsForSession({ sessionUser }),
	]);
	const xClient = new XApiV2Client();
	const bookmarkedTweetIds = new Set(bookmarks.map((bookmark) => bookmark.tweetId));
	const dismissedTweetIdSet = new Set(dismissedTweetIds);
	const candidateById = new Map<string, Candidate>();
	const followedCreators = new Set(followSummary.creatorFollows.map((follow) => normalize(follow.creatorUsername)));

	for (const follow of followSummary.creatorFollows.slice(0, 4)) {
		const tweets = await xClient.getLatestPostsByUsername(follow.creatorUsername, 5);
		for (const tweet of tweets) {
			mergeCandidate(
				candidateById,
				tweet,
				{ code: "followed_creator", label: `From followed creator @${follow.creatorUsername}` },
				`creator:${normalize(follow.creatorUsername)}`,
			);
		}
	}

	const subjectQueries = new Set<string>(followSummary.subjectFollows.map((follow) => follow.subjectTag));
	for (const tag of deriveTopBookmarkTags(bookmarks.flatMap((bookmark) => bookmark.tags), 3)) {
		subjectQueries.add(tag);
	}
	for (const query of Array.from(subjectQueries).slice(0, 5)) {
		const page = await xClient.searchRecentPosts(query, 8);
		for (const tweet of page.tweets) {
			mergeCandidate(
				candidateById,
				tweet,
				{ code: "subject_search", label: `Matches ${query}` },
				`subject:${normalize(query)}`,
			);
		}
	}

	for (const follow of takeawayWorkspace.follows.slice(0, 3)) {
		const history = await getTakeawayHistoryForSession({ sessionUser, followId: follow.id });
		const latest = history.latest;
		if (!latest) {
			continue;
		}
		for (const takeaway of latest.takeaways.slice(0, 2)) {
			const query = takeaway.split(/[.!?]/)[0]?.trim();
			if (!query) {
				continue;
			}
			const page = await xClient.searchRecentPosts(query, 5);
			for (const tweet of page.tweets) {
				mergeCandidate(
					candidateById,
					tweet,
					{ code: "takeaway_theme", label: `Related to takeaway theme from @${follow.accountUsername}` },
					`takeaway:${normalize(follow.accountUsername)}`,
				);
			}
		}
	}

	const ranked = Array.from(candidateById.values())
		.filter((candidate) => !bookmarkedTweetIds.has(candidate.tweet.id) && !dismissedTweetIdSet.has(candidate.tweet.id))
		.map((candidate) => ({
			candidate,
			score: scoreCandidate({
				candidate,
				bookmarks,
				followedCreators,
			}),
		}))
		.filter((item) => item.score > 0)
		.sort((left, right) => right.score - left.score)
		.slice(0, limit)
		.map(({ candidate, score }) => ({
			tweetId: candidate.tweet.id,
			tweetText: candidate.tweet.text,
			tweetUrlOrId: buildTweetUrl(candidate.tweet),
			authorUsername: candidate.tweet.authorUsername ?? "unknown",
			authorName: candidate.tweet.authorName,
			authorAvatarUrl: candidate.tweet.authorAvatarUrl,
			score,
			reasons: candidate.reasons,
			sourceSignals: candidate.sourceSignals,
			suggestedTags: suggestBookmarkTags({
				text: candidate.tweet.text,
				authorUsername: candidate.tweet.authorUsername,
				existingBookmarks: bookmarks,
				subjectFollows: followSummary.subjectFollows,
			}).slice(0, 4),
		}))
		.map((item) => ({
			...item,
			suggestedTags: item.suggestedTags.length > 0 ? item.suggestedTags : ["Inbox"],
		}));

	return await upsertSuggestionsForSession({
		sessionUser,
		suggestions: ranked,
	});
}
