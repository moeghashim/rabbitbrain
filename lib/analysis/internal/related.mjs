import { dedupeTweets, search } from "./x-api.mjs";
import { extractKeywords, overlapScore } from "./text.mjs";

export async function getRelatedPosts(primary) {
  const tokens = extractKeywords(primary.text, 4);
  const tokenQuery = tokens.length
    ? `(${tokens.join(" OR ")})`
    : primary.username;
  const fromAuthor = `from:${primary.username} ${tokenQuery} -is:retweet -is:reply`;
  const byTopic = `${tokenQuery} -is:retweet -is:reply lang:en`;

  const [authorPosts, topicPosts] = await Promise.all([
    search(fromAuthor, { pages: 1, sortOrder: "recency" }),
    search(byTopic, { pages: 1, sortOrder: "relevancy" }),
  ]);

  const combined = dedupeTweets([...authorPosts, ...topicPosts]).filter(
    (tweet) => tweet.id !== primary.id,
  );

  return combined
    .filter((tweet) => {
      if (tweet.username.toLowerCase() === primary.username.toLowerCase()) {
        return true;
      }

      return overlapScore(primary.text, tweet.text) >= 2;
    })
    .sort((a, b) => {
      const aScore =
        overlapScore(primary.text, a.text) +
        a.metrics.likes / 30 +
        a.metrics.retweets / 20;
      const bScore =
        overlapScore(primary.text, b.text) +
        b.metrics.likes / 30 +
        b.metrics.retweets / 20;
      return bScore - aScore;
    })
    .slice(0, 10);
}
