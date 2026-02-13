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

export function extractTweetId(xUrl: string): string | null;

export function analyzePost(args: { xUrl: string }): Promise<AnalyzeResult>;
