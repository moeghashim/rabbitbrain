import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createAnalysis } from "@/lib/convex";
import { embeddedXResearchProvider } from "@/lib/xresearch/provider";
import { extractTweetId } from "@/lib/xresearch/url";

const requestSchema = z.object({
  xUrl: z.string().url()
});

const rateWindowMs = 60_000;
const maxRequestsPerWindow = 20;
const rateMap = new Map<string, { count: number; startedAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const current = rateMap.get(userId);

  if (!current || now - current.startedAt > rateWindowMs) {
    rateMap.set(userId, { count: 1, startedAt: now });
    return true;
  }

  if (current.count >= maxRequestsPerWindow) {
    return false;
  }

  current.count += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { error: "Sign in required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 });
    }

    const parsedBody = requestSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid X post URL", code: "INVALID_URL" }, { status: 400 });
    }

    const tweetId = extractTweetId(parsedBody.data.xUrl);
    if (!tweetId) {
      return NextResponse.json({ error: "Invalid X post URL", code: "INVALID_URL" }, { status: 400 });
    }

    const primary = await embeddedXResearchProvider.getPrimaryPost(tweetId);
    if (!primary) {
      return NextResponse.json({ error: "Post not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const createdAt = Date.now();

    const id = await createAnalysis({
      userId: session.user.id,
      xUrl: parsedBody.data.xUrl,
      tweetId: primary.id,
      authorUsername: primary.username,
      primaryText: primary.text,
      relatedTexts: [],
      topic: "Shared Post",
      confidence: 1,
      model: "share-only",
      createdAt
    });

    return NextResponse.json({
      id,
      sharedAt: createdAt,
      xUrl: parsedBody.data.xUrl,
      primaryPost: {
        id: primary.id,
        username: primary.username,
        name: primary.name,
        text: primary.text,
        tweet_url: primary.tweet_url
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("X API")) {
      return NextResponse.json({ error: "X API unavailable", code: "X_UPSTREAM_ERROR" }, { status: 503 });
    }

    return NextResponse.json({ error: "Unable to share post", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
