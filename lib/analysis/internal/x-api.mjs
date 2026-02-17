import { BASE, FIELDS, RATE_DELAY_MS } from "./constants.mjs";

function getToken() {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    throw new Error("Missing X_BEARER_TOKEN");
  }
  return token;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiGet(url) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`X API ${response.status}: ${body.slice(0, 200)}`);
  }

  return response.json();
}

export function parseTweets(raw) {
  const data = Array.isArray(raw?.data)
    ? raw.data
    : raw?.data
      ? [raw.data]
      : [];
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
        bookmarks: Number(metrics.bookmark_count ?? 0),
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
      tweet_url: `https://x.com/${user.username ?? "?"}/status/${tweet.id}`,
    };
  });
}

export function dedupeTweets(tweets) {
  const seen = new Set();
  return tweets.filter((tweet) => {
    if (seen.has(tweet.id)) {
      return false;
    }
    seen.add(tweet.id);
    return true;
  });
}

export async function search(
  query,
  { maxResults = 60, pages = 1, sortOrder = "relevancy" } = {},
) {
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

export async function fetchPrimaryPost(tweetId) {
  const raw = await apiGet(`${BASE}/tweets/${tweetId}?${FIELDS}`);
  const parsed = parseTweets(raw);
  return parsed[0] ?? null;
}
