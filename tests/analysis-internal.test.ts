import { describe, expect, test } from "vitest";
import { buildFollowActions } from "@/lib/analysis/internal/follow.mjs";
import { computeCreatorAnalysis } from "@/lib/analysis/internal/recommendations.mjs";
import {
  extractMentionHandles,
  fallbackTopicFromText,
  isLikelyArticleUrl,
  normalizeTopic,
} from "@/lib/analysis/internal/text.mjs";

describe("analysis internal text helpers", () => {
  test("normalizeTopic keeps one or two words", () => {
    expect(normalizeTopic("prompt engineering workflows")).toBe(
      "Prompt Engineering",
    );
    expect(normalizeTopic("")).toBe("General Learning");
  });

  test("fallbackTopicFromText maps heuristics", () => {
    expect(
      fallbackTopicFromText("We built autonomous agents for workflows"),
    ).toBe("AI Agents");
  });

  test("extractMentionHandles dedupes mentions", () => {
    expect(extractMentionHandles("Thanks @alice and @bob and @alice")).toEqual([
      "alice",
      "bob",
    ]);
  });

  test("isLikelyArticleUrl excludes x.com links", () => {
    expect(isLikelyArticleUrl("https://x.com/openai/status/1")).toBe(false);
    expect(isLikelyArticleUrl("https://example.com/blog/post")).toBe(true);
  });
});

describe("analysis internal recommendations and follow actions", () => {
  test("buildFollowActions builds topic and follow URLs", () => {
    const actions = buildFollowActions({
      username: "@openai",
      topic: "AI Agents",
    });
    expect(actions.user.url).toContain("intent/follow");
    expect(actions.topic.url).toContain("search?q=AI%20Agents");
    expect(actions.userTopic.query).toContain("from:openai");
  });

  test("computeCreatorAnalysis scores engagement and follow recommendation", () => {
    const primary = {
      username: "alice",
      verified: true,
      followers_count: 5000,
      metrics: { likes: 200, retweets: 100 },
    };
    const related = [
      {
        username: "alice",
        metrics: { likes: 50, retweets: 25 },
      },
      {
        username: "other",
        metrics: { likes: 1, retweets: 1 },
      },
    ];

    const creator = computeCreatorAnalysis(primary, related);
    expect(creator.username).toBe("alice");
    expect(creator.impactScore).toBeGreaterThan(25);
    expect(creator.shouldFollow).toBe(true);
  });
});
