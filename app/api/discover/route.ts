import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { discoverTopic } from "@/lib/analysis/engine.mjs";

const requestSchema = z.object({
  topic: z.string().min(2).max(80)
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
      return NextResponse.json({ error: "Invalid topic", code: "INVALID_TOPIC" }, { status: 400 });
    }

    const discovered = await discoverTopic({ topic: parsedBody.data.topic });

    return NextResponse.json({
      id: null,
      ...discovered
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      const code = String(error.code);
      if (code === "INVALID_TOPIC") {
        return NextResponse.json({ error: "Invalid topic", code }, { status: 400 });
      }
    }

    if (error instanceof Error && error.message.includes("X API")) {
      return NextResponse.json({ error: "X API unavailable", code: "X_UPSTREAM_ERROR" }, { status: 503 });
    }

    return NextResponse.json({ error: "Unable to discover topic", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

