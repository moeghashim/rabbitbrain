import { dedupe, search, sortBy, type Tweet } from "@/lib/xresearch/api";

const STOPWORDS = new Set([
  "the",
  "and",
  "that",
  "this",
  "with",
  "from",
  "have",
  "what",
  "will",
  "your",
  "just",
  "about",
  "https",
  "http",
  "they",
  "them"
]);

function extractKeywords(text: string, maxTerms = 4): string[] {
  const words = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));

  const unique = Array.from(new Set(words));
  return unique.slice(0, maxTerms);
}

function overlapScore(base: string, candidate: string): number {
  const baseSet = new Set(extractKeywords(base, 20));
  const candidateSet = new Set(extractKeywords(candidate, 20));

  let overlap = 0;
  for (const token of candidateSet) {
    if (baseSet.has(token)) {
      overlap += 1;
    }
  }

  return overlap;
}

export async function getRelatedPosts(primary: Tweet): Promise<Tweet[]> {
  const tokens = extractKeywords(primary.text);
  const tokenQuery = tokens.length ? `(${tokens.join(" OR ")})` : primary.username;

  const fromAuthor = `from:${primary.username} ${tokenQuery} -is:retweet -is:reply`;
  const byTopic = `${tokenQuery} -is:retweet -is:reply lang:en`;

  const [authorPosts, topicPosts] = await Promise.all([
    search(fromAuthor, { pages: 1, sortOrder: "recency" }),
    search(byTopic, { pages: 1, sortOrder: "relevancy" })
  ]);

  const combined = dedupe([...authorPosts, ...topicPosts]).filter((tweet) => tweet.id !== primary.id);

  const ranked = sortBy(combined, "likes").sort((a, b) => {
    const aScore = overlapScore(primary.text, a.text) + a.metrics.likes / 30 + a.metrics.retweets / 20;
    const bScore = overlapScore(primary.text, b.text) + b.metrics.likes / 30 + b.metrics.retweets / 20;
    return bScore - aScore;
  });

  return ranked.slice(0, 8);
}
