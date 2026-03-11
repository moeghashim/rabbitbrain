import type { TweetPayload } from "@pi-starter/x-client";

function compactIncludes(tweet: TweetPayload) {
	return {
		id: tweet.id,
		text: tweet.text,
		authorId: tweet.authorId,
		authorUsername: tweet.authorUsername,
		authorName: tweet.authorName,
		authorAvatarUrl: tweet.authorAvatarUrl,
		media: tweet.media ?? [],
		publicMetrics: tweet.publicMetrics ?? {},
	};
}

export function buildTweetAnalysisSystemPrompt(): string {
	return [
		"You are analyzing a post on X.",
		"Return only a valid JSON object with exactly these keys: topic, summary, intent, novelConcepts.",
		"novelConcepts must be an array with exactly 5 objects.",
		"Each concept object must have keys: name and whyItMattersInTweet.",
		"topic, summary, intent, name, and whyItMattersInTweet must be non-empty strings.",
		"Do not include markdown fences, comments, or extra keys.",
		"Keep it factual and avoid speculation when evidence is missing.",
	].join(" ");
}

export function buildTweetAnalysisUserPrompt(tweet: TweetPayload): string {
	return JSON.stringify(
		{
			tweet: compactIncludes(tweet),
		},
		null,
		2,
	);
}
