#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";

const FIELDS =
  "tweet.fields=created_at,public_metrics,author_id,conversation_id,entities&expansions=author_id&user.fields=username,name,profile_image_url,verified,public_metrics";

function printHelp() {
  process.stdout.write(
    [
      "Rabbitbrain CLI",
      "",
      "Usage:",
      "  rabbitbrain share --url <x-post-url> [--user-id <id>] [--pretty]",
      "  rabbitbrain --help",
      "",
      "Options:",
      "  --url <url>        Required X/Twitter post URL",
      "  --user-id <id>     Optional user id. If provided, save result to Convex",
      "  --pretty           Pretty-print JSON output",
      "  --help             Show this help",
      "",
      "Env:",
      "  X_BEARER_TOKEN     Required",
      "  CONVEX_URL         Required only when --user-id is provided"
    ].join("\n")
  );
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      flags.help = true;
      continue;
    }
    if (arg === "--pretty") {
      flags.pretty = true;
      continue;
    }
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for --${key}`);
      }
      flags[key] = value;
      i += 1;
      continue;
    }
    positional.push(arg);
  }

  return { positional, flags };
}

function extractTweetId(xUrl) {
  const match = xUrl.trim().match(/(?:x|twitter)\.com\/[A-Za-z0-9_]+\/status\/(\d+)/i);
  return match?.[1] ?? null;
}

function getBearerToken() {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    throw new Error("Missing X_BEARER_TOKEN");
  }
  return token;
}

function getConvexUrl() {
  const url = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing CONVEX_URL (or NEXT_PUBLIC_CONVEX_URL)");
  }
  return url;
}

async function fetchPrimaryPost(tweetId) {
  const response = await fetch(`https://api.x.com/2/tweets/${tweetId}?${FIELDS}`, {
    headers: {
      Authorization: `Bearer ${getBearerToken()}`
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`X API ${response.status}: ${body.slice(0, 200)}`);
  }

  const raw = await response.json();
  const tweet = raw?.data;
  const user = Array.isArray(raw?.includes?.users) ? raw.includes.users[0] : undefined;
  if (!tweet) {
    return null;
  }

  return {
    id: tweet.id,
    text: tweet.text,
    username: user?.username ?? "?",
    name: user?.name ?? "?",
    profileImageUrl: user?.profile_image_url ?? null,
    verified: user?.verified ?? false,
    tweet_url: `https://x.com/${user?.username ?? "?"}/status/${tweet.id}`
  };
}

async function saveSharedPost({ userId, xUrl, primaryPost, sharedAt }) {
  const client = new ConvexHttpClient(getConvexUrl());
  const id = await client.mutation("analyses:create", {
    userId,
    xUrl,
    tweetId: primaryPost.id,
    authorUsername: primaryPost.username,
    primaryText: primaryPost.text,
    relatedTexts: [],
    topic: "Shared Post",
    confidence: 1,
    model: "share-only",
    createdAt: sharedAt
  });
  return String(id);
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const command = positional[0];

  if (flags.help || !command) {
    printHelp();
    process.exit(0);
  }

  if (command !== "share") {
    throw new Error(`Unknown command: ${command}`);
  }

  const xUrl = flags.url;
  if (!xUrl) {
    throw new Error("Missing --url");
  }

  const tweetId = extractTweetId(xUrl);
  if (!tweetId) {
    throw new Error("Invalid X post URL");
  }

  const primaryPost = await fetchPrimaryPost(tweetId);
  if (!primaryPost) {
    throw new Error("Post not found");
  }

  const sharedAt = Date.now();
  const userId = flags["user-id"] ?? null;
  const id = userId
    ? await saveSharedPost({
        userId,
        xUrl,
        primaryPost,
        sharedAt
      })
    : null;

  const output = {
    id,
    xUrl,
    sharedAt,
    primaryPost
  };

  process.stdout.write(`${JSON.stringify(output, null, flags.pretty ? 2 : 0)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
