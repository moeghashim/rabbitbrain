import { extractKeywords, normalizeTopic } from "./text.mjs";

export function scoreTweet(metrics) {
  const likes = Number(metrics?.likes ?? 0);
  const retweets = Number(metrics?.retweets ?? 0);
  return Number((likes + retweets).toFixed(2));
}

export function createEmptyMetrics() {
  return {
    likes: 0,
    retweets: 0,
    replies: 0,
    quotes: 0,
    impressions: 0,
    bookmarks: 0,
  };
}

export function addMetrics(target, add) {
  target.likes += Number(add?.likes ?? 0);
  target.retweets += Number(add?.retweets ?? 0);
  target.replies += Number(add?.replies ?? 0);
  target.quotes += Number(add?.quotes ?? 0);
  target.impressions += Number(add?.impressions ?? 0);
  target.bookmarks += Number(add?.bookmarks ?? 0);
  return target;
}

export function pushEvidencePost(entry, evidence, limit = 3) {
  entry.evidencePosts.push(evidence);
  entry.evidencePosts.sort((a, b) => b.score - a.score);
  if (entry.evidencePosts.length > limit) {
    entry.evidencePosts.length = limit;
  }
}

export function computeSimilarPeople(primary, related, limit = 5) {
  const primaryKeywordSet = new Set(extractKeywords(primary.text, 12));
  const candidates = new Map();

  for (const tweet of related) {
    if (
      !tweet.username ||
      tweet.username === "?" ||
      tweet.username.toLowerCase() === primary.username.toLowerCase()
    ) {
      continue;
    }

    const sharedTokens = extractKeywords(tweet.text, 10).filter((token) =>
      primaryKeywordSet.has(token),
    );
    if (!sharedTokens.length) {
      continue;
    }

    const current = candidates.get(tweet.username) ?? {
      username: tweet.username,
      name: tweet.name,
      score: 0,
      sharedTokens: new Set(),
      overlapCount: 0,
    };

    current.score +=
      sharedTokens.length * 2 +
      tweet.metrics.likes / 80 +
      tweet.metrics.retweets / 50;
    current.overlapCount += sharedTokens.length;

    for (const token of sharedTokens.slice(0, 3)) {
      current.sharedTokens.add(token);
    }

    candidates.set(tweet.username, current);
  }

  return [...candidates.values()]
    .filter((entry) => entry.overlapCount >= 2 && entry.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => ({
      username: entry.username,
      name: entry.name,
      score: Number(entry.score.toFixed(2)),
      reason: `Posts repeatedly about ${[...entry.sharedTokens].slice(0, 2).join(" and ") || "this topic"}.`,
    }));
}

export function computeTopicsToFollow(primary, related, limit = 5) {
  const primaryKeywordSet = new Set(extractKeywords(primary.text, 12));
  const map = new Map();

  const allTweets = [primary, ...related];
  for (const tweet of allTweets) {
    for (const hashtag of tweet.hashtags ?? []) {
      const topic = normalizeTopic(String(hashtag).replace(/^#/, ""));
      if (!topic || topic === "General Learning") {
        continue;
      }

      const current = map.get(topic) ?? { topic, score: 0, count: 0 };
      current.score += 2;
      current.count += 1;
      map.set(topic, current);
    }

    for (const keyword of extractKeywords(tweet.text, 6)) {
      if (tweet.id !== primary.id && !primaryKeywordSet.has(keyword)) {
        continue;
      }

      const topic = normalizeTopic(keyword);
      if (!topic || topic === "General Learning") {
        continue;
      }
      const current = map.get(topic) ?? { topic, score: 0, count: 0 };
      current.score += 1;
      current.count += 1;
      map.set(topic, current);
    }
  }

  return [...map.values()]
    .filter((entry) => entry.count >= 2 || entry.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => ({
      topic: entry.topic,
      score: Number(entry.score.toFixed(2)),
      reason: `Seen ${entry.count} times in primary and related posts.`,
    }));
}

export function computeCreatorAnalysis(primary, related) {
  const creatorTweets = related.filter(
    (tweet) =>
      tweet.username &&
      tweet.username.toLowerCase() === primary.username.toLowerCase(),
  );

  const creatorLikes = creatorTweets.reduce(
    (sum, tweet) => sum + tweet.metrics.likes,
    primary.metrics.likes,
  );
  const creatorRetweets = creatorTweets.reduce(
    (sum, tweet) => sum + tweet.metrics.retweets,
    primary.metrics.retweets,
  );

  const impactScore = Math.min(
    100,
    Number(
      (
        creatorLikes / 15 +
        creatorRetweets / 8 +
        Math.log10(Math.max(10, primary.followers_count || 10)) * 8 +
        (primary.verified ? 10 : 0)
      ).toFixed(2),
    ),
  );

  const shouldFollow = impactScore >= 25;

  return {
    username: primary.username,
    shouldFollow,
    impactScore,
    reason: shouldFollow
      ? "Creator shows sustained engagement on this topic and is worth following."
      : "Creator impact is currently moderate; monitor topic evolution before following.",
  };
}
