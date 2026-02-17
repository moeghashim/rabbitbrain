import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createAnalysis } from "@/lib/convex";
import { analyzePost } from "@/lib/analysis/engine.mjs";

const requestSchema = z.object({
  xUrl: z.string().url(),
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
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Sign in required", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: "Rate limit exceeded", code: "RATE_LIMIT" },
        { status: 429 },
      );
    }

    const parsedBody = requestSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid X post URL", code: "INVALID_URL" },
        { status: 400 },
      );
    }

    const analyzed = await analyzePost({ xUrl: parsedBody.data.xUrl });

    const id = await createAnalysis({
      userId: session.user.id,
      xUrl: parsedBody.data.xUrl,
      tweetId: analyzed.internal.tweetId,
      authorUsername: analyzed.internal.authorUsername,
      primaryText: analyzed.internal.primaryText,
      relatedTexts: analyzed.internal.relatedTexts,
      topic: analyzed.analysis.topic,
      appAbout: analyzed.analysis.appAbout,
      confidence: analyzed.analysis.confidence,
      model: analyzed.analysis.model,
      similarPeople: analyzed.recommendations.similarPeople,
      topicsToFollow: analyzed.recommendations.topicsToFollow,
      creatorAnalysis: analyzed.recommendations.creator,
      mode: "analyze",
      createdAt: analyzed.analyzedAt,
    });

    return NextResponse.json({
      id,
      ...analyzed,
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      const code = String(error.code);
      if (code === "INVALID_URL") {
        return NextResponse.json(
          { error: "Invalid X post URL", code },
          { status: 400 },
        );
      }
      if (code === "NOT_FOUND") {
        return NextResponse.json(
          { error: "Post not found", code },
          { status: 404 },
        );
      }
    }

    if (error instanceof Error && error.message.includes("X API")) {
      return NextResponse.json(
        { error: "X API unavailable", code: "X_UPSTREAM_ERROR" },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Unable to analyze post", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
