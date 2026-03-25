import type { AnalyzeTweetResponse, TweetPreview } from "./index.js";

function normalizeUsername(username?: string): string | undefined {
	if (!username) {
		return undefined;
	}

	const trimmed = username.trim();
	if (trimmed.length === 0) {
		return undefined;
	}

	return trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
}

function buildAuthorLabel(tweet: TweetPreview): string {
	const username = normalizeUsername(tweet.authorUsername);
	const authorName = tweet.authorName?.trim();
	if (authorName && username) {
		return `${authorName} (@${username})`;
	}
	if (username) {
		return `@${username}`;
	}
	if (authorName) {
		return authorName;
	}
	return "Unknown author";
}

export function buildAnalyzeTweetCanonicalUrl(tweet: Pick<TweetPreview, "id" | "authorUsername">): string {
	const username = normalizeUsername(tweet.authorUsername);
	if (username) {
		return `https://x.com/${username}/status/${tweet.id}`;
	}
	return `https://x.com/i/web/status/${tweet.id}`;
}

export function renderAnalyzeTweetMarkdown(result: AnalyzeTweetResponse): string {
	const thread = result.thread && result.thread.tweets.length > 1 ? result.thread : undefined;
	const lines = [
		`# ${buildAuthorLabel(result.tweet)}`,
		"",
		`- Tweet ID: ${result.tweet.id}`,
		`- URL: ${buildAnalyzeTweetCanonicalUrl(result.tweet)}`,
	];

	if (thread) {
		lines.push(`- Thread Posts: ${thread.tweets.length}`);
	}

	lines.push("", "## Tweet", "", result.tweet.text, "");

	if (thread) {
		lines.push("## Thread", "");
		for (const [index, tweet] of thread.tweets.entries()) {
			lines.push(`### Post ${index + 1}`);
			lines.push(buildAnalyzeTweetCanonicalUrl(tweet));
			lines.push("");
			lines.push(tweet.text);
			lines.push("");
		}
	}

	lines.push("## Analysis", "");
	lines.push(`- Topic: ${result.analysis.topic}`);
	lines.push(`- Summary: ${result.analysis.summary}`);
	lines.push(`- Intent: ${result.analysis.intent}`);
	lines.push("");
	lines.push("## Concepts", "");
	for (const concept of result.analysis.novelConcepts) {
		lines.push(`- ${concept.name}: ${concept.whyItMattersInTweet}`);
	}

	return lines.join("\n");
}
