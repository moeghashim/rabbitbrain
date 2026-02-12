/**
 * Adapted from rohunvora/x-research-skill (commit c21149b272eb724d4f5a785a17a2f0312440c82b)
 * Source snapshot: vendor/x-research-skill/upstream-api.ts
 */

const BASE = "https://api.x.com/2";
const RATE_DELAY_MS = 350;

export type Tweet = {
  id: string;
  text: string;
  author_id: string;
  username: string;
  name: string;
  profile_image_url?: string;
  verified?: boolean;
  created_at: string;
  conversation_id: string;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    quotes: number;
    impressions: number;
    bookmarks: number;
  };
  urls: string[];
  mentions: string[];
  hashtags: string[];
  tweet_url: string;
};

type RawResponse = {
  data?: RawTweetData[] | RawTweetData;
  includes?: { users?: RawUser[] };
  meta?: { next_token?: string; result_count?: number };
};

type RawUser = {
  id?: string;
  username?: string;
  name?: string;
  profile_image_url?: string;
  verified?: boolean;
};

type RawTweetMetrics = {
  like_count?: number;
  retweet_count?: number;
  reply_count?: number;
  quote_count?: number;
  impression_count?: number;
  bookmark_count?: number;
};

type RawTweetData = {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  conversation_id: string;
  public_metrics?: RawTweetMetrics;
  entities?: {
    urls?: Array<{ expanded_url?: string }>;
    mentions?: Array<{ username?: string }>;
    hashtags?: Array<{ tag?: string }>;
  };
};

const FIELDS =
  "tweet.fields=created_at,public_metrics,author_id,conversation_id,entities&expansions=author_id&user.fields=username,name,profile_image_url,verified,public_metrics";

function getToken(): string {
  if (process.env.X_BEARER_TOKEN) {
    return process.env.X_BEARER_TOKEN;
  }

  throw new Error("Missing X_BEARER_TOKEN");
}

function parseTweets(raw: { data?: RawTweetData[]; includes?: { users?: RawUser[] } }): Tweet[] {
  if (!raw.data) {
    return [];
  }

  const users: Record<string, RawUser> = {};
  for (const user of raw.includes?.users ?? []) {
    if (user.id) {
      users[user.id] = user;
    }
  }

  return raw.data.map((tweet) => {
    const user = users[tweet.author_id];
    const metrics = tweet.public_metrics;

    return {
      id: tweet.id,
      text: tweet.text,
      author_id: tweet.author_id,
      username: user?.username ?? "?",
      name: user?.name ?? "?",
      profile_image_url: user?.profile_image_url,
      verified: user?.verified ?? false,
      created_at: tweet.created_at,
      conversation_id: tweet.conversation_id,
      metrics: {
        likes: metrics?.like_count ?? 0,
        retweets: metrics?.retweet_count ?? 0,
        replies: metrics?.reply_count ?? 0,
        quotes: metrics?.quote_count ?? 0,
        impressions: metrics?.impression_count ?? 0,
        bookmarks: metrics?.bookmark_count ?? 0
      },
      urls: (tweet.entities?.urls ?? [])
        .map((entry) => entry.expanded_url)
        .filter((value): value is string => Boolean(value)),
      mentions: (tweet.entities?.mentions ?? [])
        .map((entry) => entry.username)
        .filter((value): value is string => Boolean(value)),
      hashtags: (tweet.entities?.hashtags ?? [])
        .map((entry) => entry.tag)
        .filter((value): value is string => Boolean(value)),
      tweet_url: `https://x.com/${user?.username ?? "?"}/status/${tweet.id}`
    };
  });
}

function parseSince(since: string): string | null {
  const match = since.match(/^(\d+)(m|h|d)$/);
  if (match) {
    const amount = Number.parseInt(match[1], 10);
    const unit = match[2];
    const ms =
      unit === "m" ? amount * 60_000 : unit === "h" ? amount * 3_600_000 : amount * 86_400_000;
    return new Date(Date.now() - ms).toISOString();
  }

  if (since.includes("T") || since.includes("-")) {
    const candidate = new Date(since);
    if (!Number.isNaN(candidate.valueOf())) {
      return candidate.toISOString();
    }
  }

  return null;
}

async function apiGet(url: string): Promise<RawResponse> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`X API ${response.status}: ${body.slice(0, 200)}`);
  }

  return (await response.json()) as RawResponse;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function search(
  query: string,
  opts: {
    maxResults?: number;
    pages?: number;
    sortOrder?: "relevancy" | "recency";
    since?: string;
  } = {}
): Promise<Tweet[]> {
  const maxResults = Math.max(Math.min(opts.maxResults ?? 100, 100), 10);
  const pages = opts.pages ?? 1;
  const sort = opts.sortOrder ?? "relevancy";
  const encodedQuery = encodeURIComponent(query);

  let timeFilter = "";
  if (opts.since) {
    const parsed = parseSince(opts.since);
    if (parsed) {
      timeFilter = `&start_time=${parsed}`;
    }
  }

  let allTweets: Tweet[] = [];
  let nextToken: string | undefined;

  for (let page = 0; page < pages; page += 1) {
    const pagination = nextToken ? `&pagination_token=${nextToken}` : "";
    const url = `${BASE}/tweets/search/recent?query=${encodedQuery}&max_results=${maxResults}&${FIELDS}&sort_order=${sort}${timeFilter}${pagination}`;

    const raw = await apiGet(url);
    allTweets = allTweets.concat(
      parseTweets({
        data: Array.isArray(raw.data) ? raw.data : [],
        includes: raw.includes
      })
    );

    nextToken = raw.meta?.next_token;
    if (!nextToken) {
      break;
    }

    if (page < pages - 1) {
      await sleep(RATE_DELAY_MS);
    }
  }

  return allTweets;
}

export async function getTweet(tweetId: string): Promise<Tweet | null> {
  const url = `${BASE}/tweets/${tweetId}?${FIELDS}`;
  const raw = await apiGet(url);

  if (raw.data && !Array.isArray(raw.data)) {
    const parsed = parseTweets({
      ...raw,
      data: [raw.data]
    });
    return parsed[0] ?? null;
  }

  return null;
}

export function dedupe(tweets: Tweet[]): Tweet[] {
  const seen = new Set<string>();
  return tweets.filter((tweet) => {
    if (seen.has(tweet.id)) {
      return false;
    }
    seen.add(tweet.id);
    return true;
  });
}

export function sortBy(
  tweets: Tweet[],
  metric: "likes" | "impressions" | "retweets" | "replies" = "likes"
): Tweet[] {
  return [...tweets].sort((a, b) => b.metrics[metric] - a.metrics[metric]);
}
