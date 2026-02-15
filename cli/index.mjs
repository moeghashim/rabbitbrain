#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { ConvexHttpClient } from "convex/browser";
import { analyzePost, discoverTopic } from "../lib/analysis/engine.mjs";

function getCliVersion() {
  const pkgUrl = new URL("../package.json", import.meta.url);
  const pkg = JSON.parse(readFileSync(pkgUrl, "utf8"));
  return String(pkg.version ?? "0.0.0");
}

function printHelp() {
  process.stdout.write(
    [
      `Rabbitbrain CLI v${getCliVersion()}`,
      "",
      "Usage:",
      "  rabbitbrain analyze --url <x-post-url> [--user-id <id>] [--pretty]",
      "  rabbitbrain discover --topic <topic> [--pretty]",
      "  rabbitbrain --version",
      "  rabbitbrain --help",
      "",
      "Options:",
      "  --url <url>        Required X/Twitter post URL",
      "  --topic <topic>    Required topic for discovery",
      "  --user-id <id>     Optional user id. If provided, save result to Convex",
      "  --pretty           Pretty-print JSON output",
      "  --version          Print CLI version",
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
    if (arg === "--version" || arg === "-v") {
      flags.version = true;
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

  if (flags.version) {
    process.stdout.write(`${getCliVersion()}\n`);
    process.exit(0);
  }

  if (flags.help || !command) {
    printHelp();
    process.exit(0);
  }

  if (command === "share") {
    throw new Error("Command `share` has been removed. Use `analyze`.");
  }

  if (command !== "analyze" && command !== "discover") {
    throw new Error(`Unknown command: ${command}`);
  }

  if (command === "analyze") {
    const xUrl = flags.url;
    if (!xUrl) {
      throw new Error("Missing --url");
    }

    const analyzed = await analyzePost({ xUrl });

    const userId = flags["user-id"] ?? null;
    const id = userId ? await saveAnalysis({ userId, analyzed }) : null;

    const output = {
      id,
      ...analyzed
    };

    process.stdout.write(`${JSON.stringify(output, null, flags.pretty ? 2 : 0)}\n`);
    return;
  }

  const topic = flags.topic;
  if (!topic) {
    throw new Error("Missing --topic");
  }

  // Discovery is currently output-only (no Convex persistence).
  const discovered = await discoverTopic({ topic });
  process.stdout.write(`${JSON.stringify(discovered, null, flags.pretty ? 2 : 0)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
