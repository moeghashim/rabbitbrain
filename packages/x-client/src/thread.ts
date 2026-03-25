import type { ThreadPayload, TweetPayload } from "./types.js";

function parseTimestamp(value: string | undefined): number {
	if (!value) {
		return Number.POSITIVE_INFINITY;
	}
	const parsed = Date.parse(value);
	return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function compareTweetsChronologically(left: TweetPayload, right: TweetPayload): number {
	const leftTimestamp = parseTimestamp(left.createdAt);
	const rightTimestamp = parseTimestamp(right.createdAt);
	if (leftTimestamp !== rightTimestamp) {
		return leftTimestamp - rightTimestamp;
	}
	return left.id.localeCompare(right.id);
}

function dedupeTweetsById(tweets: TweetPayload[]): TweetPayload[] {
	const seen = new Set<string>();
	const deduped: TweetPayload[] = [];
	for (const tweet of tweets) {
		if (seen.has(tweet.id)) {
			continue;
		}
		seen.add(tweet.id);
		deduped.push(tweet);
	}
	return deduped;
}

export function toThreadPayload(rootTweet: TweetPayload, tweets: TweetPayload[]): ThreadPayload {
	const deduped = dedupeTweetsById([rootTweet, ...tweets]).sort(compareTweetsChronologically);
	return {
		rootTweetId: rootTweet.id,
		tweets: deduped,
	};
}

function findRootTweet(thread: ThreadPayload): TweetPayload {
	return (
		thread.tweets.find((tweet) => tweet.id === thread.rootTweetId) ??
		thread.tweets[0] ?? {
			id: thread.rootTweetId,
			text: "",
			raw: thread,
		}
	);
}

export function buildThreadAnalysisText(thread: ThreadPayload): string {
	return thread.tweets
		.map((tweet, index) => {
			const authorLabel = tweet.authorUsername ? `@${tweet.authorUsername}` : "Unknown author";
			return `[${index + 1}/${thread.tweets.length}] ${authorLabel}\n${tweet.text.trim()}`;
		})
		.join("\n\n")
		.trim();
}

export function buildThreadAnalysisPayload(thread: ThreadPayload): TweetPayload {
	const rootTweet = findRootTweet(thread);
	return {
		...rootTweet,
		text: buildThreadAnalysisText(thread),
		raw: {
			rootTweet: rootTweet.raw,
			thread,
		},
	};
}
