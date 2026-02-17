import { afterEach, describe, expect, test, vi } from "vitest";
import {
  dedupe,
  getTweet,
  search,
  sortBy,
  type Tweet,
} from "@/lib/xresearch/api";

const originalFetch = global.fetch;

afterEach(() => {
  vi.restoreAllMocks();
  global.fetch = originalFetch;
});

function mockFetchResponse(response: {
  ok: boolean;
  status?: number;
  text?: () => Promise<string>;
  json?: () => Promise<unknown>;
}) {
  global.fetch = vi
    .fn()
    .mockResolvedValue(response as Response) as unknown as typeof fetch;
}

const baseTweet: Tweet = {
  id: "1",
  text: "Hello",
  author_id: "u1",
  username: "dev1",
  name: "Dev One",
  profile_image_url: "https://img.test/1.png",
  verified: false,
  created_at: "2026-02-17T00:00:00.000Z",
  conversation_id: "1",
  metrics: {
    likes: 1,
    retweets: 1,
    replies: 0,
    quotes: 0,
    impressions: 0,
    bookmarks: 0,
  },
  urls: [],
  mentions: [],
  hashtags: [],
  tweet_url: "https://x.com/dev1/status/1",
};

describe("xresearch api failure handling", () => {
  test("search throws on non-200 response", async () => {
    process.env.X_BEARER_TOKEN = "test-token";
    mockFetchResponse({
      ok: false,
      status: 503,
      text: async () => "upstream unavailable",
    });

    await expect(search("agents")).rejects.toThrow(
      "X API 503: upstream unavailable",
    );
  });

  test("search handles malformed payload by returning empty list", async () => {
    process.env.X_BEARER_TOKEN = "test-token";
    mockFetchResponse({
      ok: true,
      json: async () => ({ data: null, includes: null }),
    });

    await expect(search("agents")).resolves.toEqual([]);
  });

  test("getTweet returns null when payload shape is not a single tweet object", async () => {
    process.env.X_BEARER_TOKEN = "test-token";
    mockFetchResponse({
      ok: true,
      json: async () => ({ data: [] }),
    });

    await expect(getTweet("123")).resolves.toBeNull();
  });
});

describe("xresearch api utils", () => {
  test("dedupe removes duplicate tweet ids", () => {
    expect(dedupe([baseTweet, baseTweet])).toHaveLength(1);
  });

  test("sortBy returns descending order by metric", () => {
    const tweets: Tweet[] = [
      baseTweet,
      {
        ...baseTweet,
        id: "2",
        metrics: { ...baseTweet.metrics, likes: 15 },
      },
    ];

    const sorted = sortBy(tweets, "likes");
    expect(sorted[0]?.id).toBe("2");
    expect(sorted[1]?.id).toBe("1");
  });
});
