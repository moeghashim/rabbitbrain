export interface TweetPublicMetrics {
	replyCount?: number;
	repostCount?: number;
	likeCount?: number;
	quoteCount?: number;
	bookmarkCount?: number;
	impressionCount?: number;
}

function toNonNegativeNumber(value: unknown): number | undefined {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
		return undefined;
	}
	return value;
}

export function parseTweetPublicMetrics(value: unknown): TweetPublicMetrics | undefined {
	if (typeof value !== "object" || value === null) {
		return undefined;
	}

	const metricsRaw = value as {
		reply_count?: unknown;
		retweet_count?: unknown;
		like_count?: unknown;
		quote_count?: unknown;
		bookmark_count?: unknown;
		impression_count?: unknown;
	};

	const metrics: TweetPublicMetrics = {
		replyCount: toNonNegativeNumber(metricsRaw.reply_count),
		repostCount: toNonNegativeNumber(metricsRaw.retweet_count),
		likeCount: toNonNegativeNumber(metricsRaw.like_count),
		quoteCount: toNonNegativeNumber(metricsRaw.quote_count),
		bookmarkCount: toNonNegativeNumber(metricsRaw.bookmark_count),
		impressionCount: toNonNegativeNumber(metricsRaw.impression_count),
	};

	const hasValue = Object.values(metrics).some((entry) => typeof entry === "number");
	return hasValue ? metrics : undefined;
}
