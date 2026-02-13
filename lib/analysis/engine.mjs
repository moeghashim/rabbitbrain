const BASE = "https://api.x.com/2";
const RATE_DELAY_MS = 350;
const FIELDS =
  "tweet.fields=created_at,public_metrics,author_id,conversation_id,entities&expansions=author_id&user.fields=username,name,profile_image_url,verified,public_metrics";

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
  "them",
  "into",
  "when",
  "then",
  "than"
]);

export const ANALYZE_OUTPUT_VERSION = "1";

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
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));

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
    .sort((a, b) => {
      const aScore = overlapScore(primary.text, a.text) + a.metrics.likes / 30 + a.metrics.retweets / 20;
      const bScore = overlapScore(primary.text, b.text) + b.metrics.likes / 30 + b.metrics.retweets / 20;
      return bScore - aScore;
    })
    .slice(0, 10);
}

function computeSimilarPeople(primary, related, limit = 5) {
  const candidates = new Map();

  for (const tweet of related) {
    if (!tweet.username || tweet.username === "?" || tweet.username.toLowerCase() === primary.username.toLowerCase()) {
      continue;
    }

    const current = candidates.get(tweet.username) ?? {
      username: tweet.username,
      name: tweet.name,
      score: 0,
      reasonTokens: new Set()
    };

    current.score += overlapScore(primary.text, tweet.text) + tweet.metrics.likes / 50 + tweet.metrics.retweets / 25;

    for (const token of extractKeywords(tweet.text, 3)) {
      current.reasonTokens.add(token);
    }

    candidates.set(tweet.username, current);
  }

  return [...candidates.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => ({
      username: entry.username,
      name: entry.name,
      score: Number(entry.score.toFixed(2)),
      reason: `Frequently posts on ${[...entry.reasonTokens].slice(0, 2).join(" and ") || "this topic"}.`
    }));
}

function computeTopicsToFollow(primary, related, limit = 5) {
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

    for (const keyword of extractKeywords(tweet.text, 4)) {
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

async function fetchPrimaryPost(tweetId) {
  const raw = await apiGet(`${BASE}/tweets/${tweetId}?${FIELDS}`);
  const parsed = parseTweets(raw);
  return parsed[0] ?? null;
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
  const topicsToFollow = computeTopicsToFollow(primaryPost, relatedPosts, 5);
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
    recommendations: {
      similarPeople,
      topicsToFollow,
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
