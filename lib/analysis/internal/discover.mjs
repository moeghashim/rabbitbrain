import { DISCOVER_OUTPUT_VERSION } from "./constants.mjs";
import { buildXSearchUrl } from "./follow.mjs";
import {
  addMetrics,
  createEmptyMetrics,
  pushEvidencePost,
  scoreTweet,
} from "./recommendations.mjs";
import {
  hostnameFromUrl,
  isLikelyArticleUrl,
  normalizeTopic,
} from "./text.mjs";
import { dedupeTweets, search } from "./x-api.mjs";

export async function discoverTopic({ topic }) {
  const rawTopic = String(topic ?? "").trim();
  if (!rawTopic) {
    const error = new Error("Missing topic");
    error.code = "INVALID_TOPIC";
    throw error;
  }

  // Be conservative: we want results that are directly about the subject.
  const query = `(${rawTopic}) -is:retweet -is:reply lang:en`;
  const tweets = await search(query, { pages: 2, sortOrder: "relevancy" });
  const deduped = dedupeTweets(tweets);

  const scoredPosts = deduped
    .map((tweet) => ({
      id: tweet.id,
      tweet_url: tweet.tweet_url,
      username: tweet.username,
      name: tweet.name,
      profileImageUrl: tweet.profile_image_url,
      verified: tweet.verified,
      text: tweet.text,
      metrics: tweet.metrics,
      score: scoreTweet(tweet.metrics),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const userMap = new Map();
  for (const tweet of deduped) {
    if (!tweet.username || tweet.username === "?") {
      continue;
    }

    const key = tweet.username.toLowerCase();
    const current = userMap.get(key) ?? {
      username: tweet.username,
      name: tweet.name,
      profileImageUrl: tweet.profile_image_url,
      verified: Boolean(tweet.verified),
      followersCount: Number(tweet.followers_count ?? 0),
      postCount: 0,
      engagementScore: 0,
      metricsTotal: createEmptyMetrics(),
      evidencePosts: [],
    };

    current.postCount += 1;
    const tweetScore = scoreTweet(tweet.metrics);
    current.engagementScore += tweetScore;
    addMetrics(current.metricsTotal, tweet.metrics);
    pushEvidencePost(
      current,
      {
        id: tweet.id,
        tweet_url: tweet.tweet_url,
        text: tweet.text,
        metrics: tweet.metrics,
        score: tweetScore,
      },
      3,
    );
    current.followersCount = Math.max(
      current.followersCount,
      Number(tweet.followers_count ?? 0),
    );
    current.profileImageUrl =
      current.profileImageUrl ?? tweet.profile_image_url;
    current.verified = current.verified || Boolean(tweet.verified);
    userMap.set(key, current);
  }

  const users = [...userMap.values()]
    .map((entry) => {
      const score =
        entry.engagementScore +
        entry.postCount * 4 +
        Math.log10(Math.max(10, entry.followersCount)) * 6 +
        (entry.verified ? 8 : 0);
      return {
        username: entry.username,
        name: entry.name,
        profileImageUrl: entry.profileImageUrl,
        verified: entry.verified,
        score: Number(score.toFixed(2)),
        postCount: entry.postCount,
        metricsTotal: entry.metricsTotal,
        evidencePosts: entry.evidencePosts,
        reason: `High engagement across ${entry.postCount} posts about "${rawTopic}".`,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const articleMap = new Map();
  for (const tweet of deduped) {
    const tweetScore = scoreTweet(tweet.metrics);
    for (const url of tweet.urls ?? []) {
      if (!isLikelyArticleUrl(url)) {
        continue;
      }
      const key = url;
      const current = articleMap.get(key) ?? {
        url,
        domain: hostnameFromUrl(url),
        count: 0,
        score: 0,
      };
      current.count += 1;
      current.score += tweetScore;
      articleMap.set(key, current);
    }
  }

  const articles = [...articleMap.values()]
    .map((entry) => ({
      url: entry.url,
      domain: entry.domain,
      score: Number((entry.score + entry.count * 5).toFixed(2)),
      reason: `Linked by ${entry.count} posts found for "${rawTopic}".`,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const discoveredAt = Date.now();
  const displayTopic = normalizeTopic(rawTopic);

  return {
    version: DISCOVER_OUTPUT_VERSION,
    topic: displayTopic,
    query,
    discoveredAt,
    follow: {
      topic: {
        topic: displayTopic,
        query: rawTopic,
        url: buildXSearchUrl(rawTopic),
      },
    },
    results: {
      users,
      posts: scoredPosts,
      articles,
    },
    internal: {
      rawTopic,
      tweetCount: deduped.length,
    },
  };
}
