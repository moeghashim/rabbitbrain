import { ConvexHttpClient } from "convex/browser";

type AnalysisCreateArgs = {
  userId: string;
  xUrl: string;
  tweetId: string;
  authorUsername: string;
  primaryText: string;
  relatedTexts: string[];
  topic: string;
  appAbout?: string;
  confidence: number;
  model: string;
  similarPeople?: Array<{ username: string; name: string; score: number; reason: string }>;
  topicsToFollow?: Array<{ topic: string; score: number; reason: string }>;
  creatorAnalysis?: { username: string; shouldFollow: boolean; impactScore: number; reason: string };
  mode?: string;
  createdAt: number;
};

export type AnalysisHistoryItem = {
  _id: string;
  topic: string;
  appAbout?: string;
  confidence: number;
  xUrl: string;
  primaryText: string;
  createdAt: number;
};

function getConvexUrl(): string {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL;
  if (!url) {
    throw new Error("Set NEXT_PUBLIC_CONVEX_URL or CONVEX_URL");
  }

  return url;
}

function getClient(): ConvexHttpClient {
  return new ConvexHttpClient(getConvexUrl());
}

export async function createAnalysis(args: AnalysisCreateArgs): Promise<string> {
  const id = await getClient().mutation("analyses:create" as never, args as never);
  return String(id);
}

export async function listUserAnalyses(userId: string): Promise<AnalysisHistoryItem[]> {
  const analyses = await getClient().query(
    "analyses:listByUser" as never,
    { userId, limit: 25 } as never
  );
  return analyses as AnalysisHistoryItem[];
}
