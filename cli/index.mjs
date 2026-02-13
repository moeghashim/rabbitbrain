#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { analyzePost } from "../lib/analysis/engine.mjs";

function printHelp() {
  process.stdout.write(
    [
      "Rabbitbrain CLI",
      "",
      "Usage:",
      "  rabbitbrain analyze --url <x-post-url> [--user-id <id>] [--pretty]",
      "  rabbitbrain share --url <x-post-url> [--user-id <id>] [--pretty] (alias)",
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

function getConvexUrl() {
  const url = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing CONVEX_URL (or NEXT_PUBLIC_CONVEX_URL)");
  }
  return url;
}

async function saveAnalysis({ userId, analyzed }) {
  const client = new ConvexHttpClient(getConvexUrl());
  const id = await client.mutation("analyses:create", {
    userId,
    xUrl: analyzed.xUrl,
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
    createdAt: analyzed.analyzedAt
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

  const normalizedCommand = command === "share" ? "analyze" : command;
  if (normalizedCommand !== "analyze") {
    throw new Error(`Unknown command: ${command}`);
  }

  const xUrl = flags.url;
  if (!xUrl) {
    throw new Error("Missing --url");
  }

  if (command === "share") {
    process.stderr.write("`share` is deprecated. Use `analyze`.\n");
  }

  const analyzed = await analyzePost({ xUrl });

  const userId = flags["user-id"] ?? null;
  const id = userId ? await saveAnalysis({ userId, analyzed }) : null;

  const output = {
    id,
    ...analyzed
  };

  process.stdout.write(`${JSON.stringify(output, null, flags.pretty ? 2 : 0)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
