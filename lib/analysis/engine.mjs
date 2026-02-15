const BASE = "https://api.x.com/2";
const RATE_DELAY_MS = 350;
const FIELDS =
  "tweet.fields=created_at,public_metrics,author_id,conversation_id,entities&expansions=author_id&user.fields=username,name,profile_image_url,verified,public_metrics";

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "new",
  "now",
  "first",
  "not",
  "out",
  "one",
  "more",
  "their",
  "there",
  "about",
  "into",
  "from",
  "with",
  "this",
  "that",
  "then",
  "than",
  "while",
  "where",
  "which",
  "what",
  "when",
  "will",
  "your",
  "just",
  "have",
  "been",
  "were",
  "they",
  "them",
  "does",
  "did",
  "are",
  "you",
  "our",
  "can",
  "under",
  "specific",
  "shows",
  "show",
  "today",
  "release",
  "releasing",
  "released",
  "using",
  "result",
  "results",
  "that",
  "https",
  "http",
  "were"
]);

export const ANALYZE_OUTPUT_VERSION = "2";
export const DISCOVER_OUTPUT_VERSION = "1";

function getToken() {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    throw new Error("Missing X_BEARER_TOKEN");
  }
  return token;
}

export function extractTweetId(xUrl) {
  const match = xUrl.trim().match(/(?:x|twitter)\.com\/[A-Za-z0-9_]+\/status\/(\d+)/i);
  return match?.[1] ?? null;
}

function buildXSearchUrl(query) {
  return `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query`;
}

function buildXFollowIntentUrl(username) {
  return `https://x.com/intent/follow?screen_name=${encodeURIComponent(username)}`;
}

function buildFollowActions({ username, topic }) {
  const trimmedTopic = String(topic ?? "").trim();
  const trimmedUsername = String(username ?? "").trim().replace(/^@/, "");

  const topicQuery = trimmedTopic || "topic";
  const userTopicQuery =
    trimmedUsername && trimmedTopic ? `from:${trimmedUsername} ${trimmedTopic}` : topicQuery;

  return {
    topic: {
      topic: trimmedTopic || topicQuery,
      query: topicQuery,
      url: buildXSearchUrl(topicQuery)
    },
    user: {
      username: trimmedUsername || username,
      url: trimmedUsername ? buildXFollowIntentUrl(trimmedUsername) : "https://x.com"
    },
    userTopic: {
      username: trimmedUsername || username,
      topic: trimmedTopic || topicQuery,
      query: userTopicQuery,
      url: buildXSearchUrl(userTopicQuery)
    }
  };
}

function scoreTweet(metrics) {
  const likes = Number(metrics?.likes ?? 0);
  const retweets = Number(metrics?.retweets ?? 0);
  const replies = Number(metrics?.replies ?? 0);
  const quotes = Number(metrics?.quotes ?? 0);

  // Damp-heavy metric. Keeps results stable across viral spikes.
  const base =
    Math.log10(1 + likes) * 8 +
    Math.log10(1 + retweets) * 12 +
    Math.log10(1 + replies) * 5 +
    Math.log10(1 + quotes) * 6;

  return Number(base.toFixed(2));
}

function hostnameFromUrl(raw) {
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isLikelyArticleUrl(raw) {
  const host = hostnameFromUrl(raw);
  if (!host) {
    return false;
  }
  if (host === "x.com" || host === "twitter.com" || host.endsWith(".x.com")) {
    return false;
  }
  return true;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiGet(url) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`X API ${response.status}: ${body.slice(0, 200)}`);
  }

  return response.json();
}

function parseTweets(raw) {
  const data = Array.isArray(raw?.data) ? raw.data : raw?.data ? [raw.data] : [];
  if (!data.length) {
    return [];
  }

  const users = {};
  for (const user of raw?.includes?.users ?? []) {
    if (user?.id) {
      users[user.id] = user;
    }
  }

  return data.map((tweet) => {
    const user = users[tweet.author_id] ?? {};
    const metrics = tweet.public_metrics ?? {};
    const userMetrics = user.public_metrics ?? {};

    return {
      id: tweet.id,
      text: tweet.text ?? "",
      author_id: tweet.author_id,
      username: user.username ?? "?",
      name: user.name ?? "?",
      profile_image_url: user.profile_image_url ?? null,
      verified: Boolean(user.verified),
      followers_count: Number(userMetrics.followers_count ?? 0),
      created_at: tweet.created_at,
      conversation_id: tweet.conversation_id,
      metrics: {
        likes: Number(metrics.like_count ?? 0),
        retweets: Number(metrics.retweet_count ?? 0),
        replies: Number(metrics.reply_count ?? 0),
        quotes: Number(metrics.quote_count ?? 0),
        impressions: Number(metrics.impression_count ?? 0),
        bookmarks: Number(metrics.bookmark_count ?? 0)
      },
      urls: (tweet.entities?.urls ?? [])
        .map((entry) => entry?.expanded_url)
        .filter((value) => Boolean(value)),
      mentions: (tweet.entities?.mentions ?? [])
        .map((entry) => entry?.username)
        .filter((value) => Boolean(value)),
      hashtags: (tweet.entities?.hashtags ?? [])
        .map((entry) => entry?.tag)
        .filter((value) => Boolean(value)),
      tweet_url: `https://x.com/${user.username ?? "?"}/status/${tweet.id}`
    };
  });
}

function dedupeTweets(tweets) {
  const seen = new Set();
  return tweets.filter((tweet) => {
    if (seen.has(tweet.id)) {
      return false;
    }
    seen.add(tweet.id);
    return true;
  });
}

function extractKeywords(text, maxTerms = 8) {
  const words = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOPWORDS.has(word));

  const counts = new Map();
  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTerms)
    .map((entry) => entry[0]);
}

function overlapScore(base, candidate) {
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

function normalizeTopic(raw) {
  const cleaned = String(raw ?? "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) {
    return "General Learning";
  }

  return cleaned
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function fallbackTopicFromText(text) {
  const heuristics = [
    { topic: "AI Agents", patterns: [/\bagent(s)?\b/i, /workflow/i, /autonom/i] },
    { topic: "Prompt Engineering", patterns: [/\bprompt(s)?\b/i, /instruction/i, /context window/i] },
    { topic: "Model Evaluation", patterns: [/benchmark/i, /eval(s|uation)?/i, /leaderboard/i] },
    { topic: "Product Strategy", patterns: [/go-to-market/i, /positioning/i, /strategy/i] },
    { topic: "Developer Tools", patterns: [/sdk/i, /framework/i, /library/i, /tooling/i] },
    { topic: "Growth Marketing", patterns: [/funnel/i, /acquisition/i, /retention/i, /conversion/i] }
  ];

  for (const entry of heuristics) {
    if (entry.patterns.some((pattern) => pattern.test(text))) {
      return entry.topic;
    }
  }

  const tokens = extractKeywords(text, 2);
  if (!tokens.length) {
    return "General Learning";
  }
  return normalizeTopic(tokens.join(" "));
}

async function classifyTopicAndSummary(primary, related) {
  const model = process.env.XAI_MODEL ?? "grok-4-fast";
  const apiKey = process.env.XAI_API_KEY;
  const allText = [primary.text, ...related.map((tweet) => tweet.text)].join("\n\n");

  const fallbackTopic = fallbackTopicFromText(allText);
  const fallbackSummary = `This post is mainly about ${fallbackTopic.toLowerCase()} and practical takeaways from current discussion on X.`;

  if (!apiKey) {
    return {
      topic: fallbackTopic,
      appAbout: fallbackSummary,
      confidence: 0.45,
      model: `${model}-fallback`
    };
  }

  const prompt = [
    "Analyze the primary X post and related context.",
    "Return JSON with keys:",
    '{"topic": string, "appAbout": string, "confidence": number}',
    "Rules:",
    "- topic must be one or two words, title case.",
    "- appAbout must be one sentence for app integrators.",
    "- confidence must be 0..1"
  ].join("\n");

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: JSON.stringify({
            primaryPost: primary.text,
            relatedPosts: related.map((tweet) => tweet.text).slice(0, 8)
          })
        }
      ]
    })
  });

  if (!response.ok) {
    return {
      topic: fallbackTopic,
      appAbout: fallbackSummary,
      confidence: 0.5,
      model: `${model}-fallback`
    };
  }

  try {
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Missing content");
    }

    const parsed = JSON.parse(content);
    const topic = normalizeTopic(parsed.topic ?? fallbackTopic);
    const appAbout = String(parsed.appAbout ?? fallbackSummary).trim() || fallbackSummary;
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence ?? 0.72)));

    return {
      topic,
      appAbout,
      confidence,
      model
    };
  } catch {
    return {
      topic: fallbackTopic,
      appAbout: fallbackSummary,
      confidence: 0.55,
      model: `${model}-fallback`
    };
  }
}

async function search(query, { maxResults = 60, pages = 1, sortOrder = "relevancy" } = {}) {
  const encodedQuery = encodeURIComponent(query);
  let allTweets = [];
  let nextToken;

  for (let page = 0; page < pages; page += 1) {
    const pagination = nextToken ? `&pagination_token=${nextToken}` : "";
    const url = `${BASE}/tweets/search/recent?query=${encodedQuery}&max_results=${maxResults}&${FIELDS}&sort_order=${sortOrder}${pagination}`;
    const raw = await apiGet(url);
    allTweets = allTweets.concat(parseTweets(raw));
    nextToken = raw?.meta?.next_token;
    if (!nextToken) {
      break;
    }

    if (page < pages - 1) {
      await sleep(RATE_DELAY_MS);
    }
  }

  return allTweets;
}

async function getRelatedPosts(primary) {
  const tokens = extractKeywords(primary.text, 4);
  const tokenQuery = tokens.length ? `(${tokens.join(" OR ")})` : primary.username;
  const fromAuthor = `from:${primary.username} ${tokenQuery} -is:retweet -is:reply`;
  const byTopic = `${tokenQuery} -is:retweet -is:reply lang:en`;

  const [authorPosts, topicPosts] = await Promise.all([
    search(fromAuthor, { pages: 1, sortOrder: "recency" }),
    search(byTopic, { pages: 1, sortOrder: "relevancy" })
  ]);

  const combined = dedupeTweets([...authorPosts, ...topicPosts]).filter((tweet) => tweet.id !== primary.id);

  return combined
    .filter((tweet) => {
      if (tweet.username.toLowerCase() === primary.username.toLowerCase()) {
        return true;
      }

      return overlapScore(primary.text, tweet.text) >= 2;
    })
    .sort((a, b) => {
      const aScore = overlapScore(primary.text, a.text) + a.metrics.likes / 30 + a.metrics.retweets / 20;
      const bScore = overlapScore(primary.text, b.text) + b.metrics.likes / 30 + b.metrics.retweets / 20;
      return bScore - aScore;
    })
    .slice(0, 10);
}

function computeSimilarPeople(primary, related, limit = 5) {
  const primaryKeywordSet = new Set(extractKeywords(primary.text, 12));
  const candidates = new Map();

  for (const tweet of related) {
    if (!tweet.username || tweet.username === "?" || tweet.username.toLowerCase() === primary.username.toLowerCase()) {
      continue;
    }

    const sharedTokens = extractKeywords(tweet.text, 10).filter((token) => primaryKeywordSet.has(token));
    if (!sharedTokens.length) {
      continue;
    }

    const current = candidates.get(tweet.username) ?? {
      username: tweet.username,
      name: tweet.name,
      score: 0,
      sharedTokens: new Set(),
      overlapCount: 0
    };

    current.score += sharedTokens.length * 2 + tweet.metrics.likes / 80 + tweet.metrics.retweets / 50;
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
      reason: `Posts repeatedly about ${[...entry.sharedTokens].slice(0, 2).join(" and ") || "this topic"}.`
    }));
}

function computeTopicsToFollow(primary, related, limit = 5) {
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
      reason: `Seen ${entry.count} times in primary and related posts.`
    }));
}

function computeCreatorAnalysis(primary, related) {
  const creatorTweets = related.filter(
    (tweet) => tweet.username && tweet.username.toLowerCase() === primary.username.toLowerCase()
  );

  const creatorLikes = creatorTweets.reduce((sum, tweet) => sum + tweet.metrics.likes, primary.metrics.likes);
  const creatorRetweets = creatorTweets.reduce(
    (sum, tweet) => sum + tweet.metrics.retweets,
    primary.metrics.retweets
  );

  const impactScore = Math.min(
    100,
    Number(
      (
        creatorLikes / 15 +
        creatorRetweets / 8 +
        Math.log10(Math.max(10, primary.followers_count || 10)) * 8 +
        (primary.verified ? 10 : 0)
      ).toFixed(2)
    )
  );

  const shouldFollow = impactScore >= 25;

  return {
    username: primary.username,
    shouldFollow,
    impactScore,
    reason: shouldFollow
      ? "Creator shows sustained engagement on this topic and is worth following."
      : "Creator impact is currently moderate; monitor topic evolution before following."
  };
}

function extractMentionHandles(text) {
  const matches = text.match(/@([A-Za-z0-9_]+)/g) ?? [];
  return [...new Set(matches.map((token) => token.slice(1)))];
}

async function fetchPrimaryPost(tweetId) {
  const raw = await apiGet(`${BASE}/tweets/${tweetId}?${FIELDS}`);
  const parsed = parseTweets(raw);
  return parsed[0] ?? null;
}

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
      score: scoreTweet(tweet.metrics)
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
      engagementScore: 0
    };

    current.postCount += 1;
    current.engagementScore += scoreTweet(tweet.metrics);
    current.followersCount = Math.max(current.followersCount, Number(tweet.followers_count ?? 0));
    current.profileImageUrl = current.profileImageUrl ?? tweet.profile_image_url;
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
        reason: `High engagement across ${entry.postCount} posts about "${rawTopic}".`
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
      const current = articleMap.get(key) ?? { url, domain: hostnameFromUrl(url), count: 0, score: 0 };
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
      reason: `Linked by ${entry.count} posts found for "${rawTopic}".`
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
        url: buildXSearchUrl(rawTopic)
      }
    },
    results: {
      users,
      posts: scoredPosts,
      articles
    },
    internal: {
      rawTopic,
      tweetCount: deduped.length
    }
  };
}

export async function analyzePost({ xUrl }) {
  const tweetId = extractTweetId(xUrl);
  if (!tweetId) {
    const error = new Error("Invalid X post URL");
    error.code = "INVALID_URL";
    throw error;
  }

  const primaryPost = await fetchPrimaryPost(tweetId);
  if (!primaryPost) {
    const error = new Error("Post not found");
    error.code = "NOT_FOUND";
    throw error;
  }

  const relatedPosts = await getRelatedPosts(primaryPost);
  const analyzedAt = Date.now();
  const analysis = await classifyTopicAndSummary(primaryPost, relatedPosts);
  const similarPeople = computeSimilarPeople(primaryPost, relatedPosts, 5);
  const mentionFallback = extractMentionHandles(primaryPost.text)
    .filter((handle) => handle.toLowerCase() !== primaryPost.username.toLowerCase())
    .slice(0, 5)
    .map((handle) => ({
      username: handle,
      name: handle,
      score: 1,
      reason: "Mentioned directly in the post as a likely relevant account."
    }));

  const mergedPeople = [...similarPeople];
  for (const candidate of mentionFallback) {
    if (!mergedPeople.some((entry) => entry.username.toLowerCase() === candidate.username.toLowerCase())) {
      mergedPeople.push(candidate);
    }
  }

  const topicsToFollow = computeTopicsToFollow(primaryPost, relatedPosts, 5);
  if (!topicsToFollow.some((entry) => entry.topic.toLowerCase() === analysis.topic.toLowerCase())) {
    topicsToFollow.unshift({
      topic: analysis.topic,
      score: 5,
      reason: "Primary post's core topic from classifier output."
    });
  }

  const creator = computeCreatorAnalysis(primaryPost, relatedPosts);

  return {
    version: ANALYZE_OUTPUT_VERSION,
    xUrl,
    analyzedAt,
    primaryPost: {
      id: primaryPost.id,
      username: primaryPost.username,
      name: primaryPost.name,
      profileImageUrl: primaryPost.profile_image_url,
      verified: primaryPost.verified,
      text: primaryPost.text,
      tweet_url: primaryPost.tweet_url
    },
    analysis,
    follow: buildFollowActions({ username: primaryPost.username, topic: analysis.topic }),
    recommendations: {
      similarPeople: mergedPeople.slice(0, 5),
      topicsToFollow: topicsToFollow.slice(0, 5),
      creator
    },
    internal: {
      tweetId: primaryPost.id,
      authorUsername: primaryPost.username,
      primaryText: primaryPost.text,
      relatedTexts: relatedPosts.map((tweet) => tweet.text)
    }
  };
}
