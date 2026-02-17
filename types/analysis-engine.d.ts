declare module "@/lib/analysis/engine.mjs" {
  export type SimilarPerson = {
    username: string;
    name: string;
    score: number;
    reason: string;
  };

  export type TopicRecommendation = {
    topic: string;
    score: number;
    reason: string;
  };

  export type CreatorRecommendation = {
    username: string;
    shouldFollow: boolean;
    impactScore: number;
    reason: string;
  };

  export type FollowActions = {
    topic: {
      topic: string;
      query: string;
      url: string;
    };
    user: {
      username: string;
      url: string;
    };
    userTopic: {
      username: string;
      topic: string;
      query: string;
      url: string;
    };
  };

  export type AnalyzeResult = {
    version: string;
    xUrl: string;
    analyzedAt: number;
    primaryPost: {
      id: string;
      username: string;
      name: string;
      profileImageUrl: string | null;
      verified: boolean;
      text: string;
      tweet_url: string;
    };
    analysis: {
      topic: string;
      appAbout: string;
      confidence: number;
      model: string;
    };
    follow: FollowActions;
    recommendations: {
      similarPeople: SimilarPerson[];
      topicsToFollow: TopicRecommendation[];
      creator: CreatorRecommendation;
    };
    internal: {
      tweetId: string;
      authorUsername: string;
      primaryText: string;
      relatedTexts: string[];
    };
  };

  export const ANALYZE_OUTPUT_VERSION: string;
  export const DISCOVER_OUTPUT_VERSION: string;
  export function extractTweetId(xUrl: string): string | null;
  export function analyzePost(args: { xUrl: string }): Promise<AnalyzeResult>;

  export type TopicDiscoveryUser = {
    username: string;
    name: string;
    profileImageUrl: string | null;
    verified: boolean;
    score: number;
    postCount: number;
    metricsTotal: TopicDiscoveryPost["metrics"];
    evidencePosts: Array<{
      id: string;
      tweet_url: string;
      text: string;
      metrics: TopicDiscoveryPost["metrics"];
      score: number;
    }>;
    reason: string;
  };

  export type TopicDiscoveryPost = {
    id: string;
    tweet_url: string;
    username: string;
    name: string;
    profileImageUrl: string | null;
    verified: boolean;
    text: string;
    metrics: {
      likes: number;
      retweets: number;
      replies: number;
      quotes: number;
      impressions: number;
      bookmarks: number;
    };
    score: number;
  };

  export type TopicDiscoveryArticle = {
    url: string;
    domain: string;
    score: number;
    reason: string;
  };

  export type DiscoverTopicResult = {
    version: string;
    topic: string;
    query: string;
    discoveredAt: number;
    follow: {
      topic: {
        topic: string;
        query: string;
        url: string;
      };
    };
    results: {
      users: TopicDiscoveryUser[];
      posts: TopicDiscoveryPost[];
      articles: TopicDiscoveryArticle[];
    };
    internal: {
      rawTopic: string;
      tweetCount: number;
    };
  };

  export function discoverTopic(args: {
    topic: string;
  }): Promise<DiscoverTopicResult>;
}
