declare module "@/lib/analysis/internal/follow.mjs" {
  export function buildFollowActions(args: {
    username: string;
    topic: string;
  }): {
    topic: { topic: string; query: string; url: string };
    user: { username: string; url: string };
    userTopic: { username: string; topic: string; query: string; url: string };
  };
}

declare module "@/lib/analysis/internal/recommendations.mjs" {
  export function computeCreatorAnalysis(
    primary: {
      username: string;
      verified?: boolean;
      followers_count?: number;
      metrics: { likes: number; retweets: number };
    },
    related: Array<{
      username: string;
      metrics: { likes: number; retweets: number };
    }>,
  ): {
    username: string;
    shouldFollow: boolean;
    impactScore: number;
    reason: string;
  };
}

declare module "@/lib/analysis/internal/text.mjs" {
  export function normalizeTopic(raw: string): string;
  export function fallbackTopicFromText(text: string): string;
  export function extractMentionHandles(text: string): string[];
  export function isLikelyArticleUrl(raw: string): boolean;
}
