import { readFileSync } from "node:fs";
import { ConvexHttpClient } from "convex/browser";
import { analyzePost, discoverTopic } from "../lib/analysis/engine.mjs";

function defaultReadPackageJson() {
  const pkgUrl = new URL("../package.json", import.meta.url);
  return JSON.parse(readFileSync(pkgUrl, "utf8"));
}

export function getCliVersion(readPackageJson = defaultReadPackageJson) {
  const pkg = readPackageJson();
  return String(pkg.version ?? "0.0.0");
}

function renderHelp(version) {
  return [
    `Rabbitbrain CLI v${version}`,
    "",
    "Usage:",
    "  rabbitbrain analyze --url <x-post-url> [--user-id <id>] [--storage <convex|local|none>] [--pretty]",
    "  rabbitbrain discover --topic <topic> [--pretty]",
    "  rabbitbrain init [--mode <local|convex>]",
    "  rabbitbrain --version",
    "  rabbitbrain --help",
    "",
    "Options:",
    "  --url <url>        Required X/Twitter post URL",
    "  --topic <topic>    Required topic for discovery",
    "  --mode <mode>      Onboarding mode for init: local | convex",
    "  --user-id <id>     Optional user id",
    "  --storage <mode>   Optional persistence mode: convex | local | none",
    "  --pretty           Pretty-print JSON output",
    "  --version          Print CLI version",
    "  --help             Show this help",
    "",
    "Env:",
    "  X_BEARER_TOKEN     Required",
    "  CONVEX_URL         Required for convex persistence",
    "  RABBITBRAIN_STORAGE Optional default storage mode",
    "  RABBITBRAIN_USER_ID Optional default user id",
    "  RABBITBRAIN_LOCAL_DB_PATH  Optional local SQLite path",
    "  RABBITBRAIN_LOCAL_MD_DIR   Optional local Markdown output path",
  ].join("\n");
}

export function parseArgs(argv) {
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

function getConvexUrl(env) {
  const url = env.CONVEX_URL ?? env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing CONVEX_URL (or NEXT_PUBLIC_CONVEX_URL)");
  }
  return url;
}

export async function saveAnalysis({
  userId,
  analyzed,
  env = process.env,
  createClient = (url) => new ConvexHttpClient(url),
}) {
  const client = createClient(getConvexUrl(env));
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
    createdAt: analyzed.analyzedAt,
  });
  return String(id);
}

async function saveAnalysisLocalLazy(args) {
  const { saveAnalysisLocal } = await import("./local-store.mjs");
  return saveAnalysisLocal(args);
}

function createInitOutput({ mode, env }) {
  const hasBearerToken = Boolean(env.X_BEARER_TOKEN);
  const hasConvexUrl = Boolean(env.CONVEX_URL ?? env.NEXT_PUBLIC_CONVEX_URL);
  const localDbPath =
    env.RABBITBRAIN_LOCAL_DB_PATH ?? ".rabbitbrain/local-analyses.db";
  const localMarkdownDir =
    env.RABBITBRAIN_LOCAL_MD_DIR ?? ".rabbitbrain/analyses-markdown";
  const defaultUserId = env.RABBITBRAIN_USER_ID ?? "local-cli-user";

  const missing = [];
  if (!hasBearerToken) {
    missing.push("X_BEARER_TOKEN");
  }
  if (mode === "convex" && !hasConvexUrl) {
    missing.push("CONVEX_URL (or NEXT_PUBLIC_CONVEX_URL)");
  }

  const setupStatus = missing.length === 0 ? "ready" : "needs_setup";
  const command =
    mode === "convex"
      ? 'rabbitbrain analyze --url "https://x.com/<user>/status/<id>" --storage convex --user-id "user_123" --pretty'
      : 'rabbitbrain analyze --url "https://x.com/<user>/status/<id>" --storage local --user-id "local_user" --pretty';
  const modeSummary =
    mode === "convex"
      ? "- Convex cloud persistence for multi-device access."
      : "- Local persistence only (SQLite + Markdown), no Convex required.";

  const lines = [
    "Rabbitbrain CLI Onboarding",
    "",
    `Selected mode: ${mode}`,
    "",
    "1) Environment checks",
    `- X_BEARER_TOKEN: ${hasBearerToken ? "set" : "missing"}`,
    `- CONVEX_URL: ${mode === "convex" ? (hasConvexUrl ? "set" : "missing") : "not required in local mode"}`,
    `- RABBITBRAIN_USER_ID: ${env.RABBITBRAIN_USER_ID ? "set" : `not set (default: ${defaultUserId})`}`,
    "",
    "2) Storage behavior",
    modeSummary,
    `- Local DB path: ${localDbPath}`,
    `- Local Markdown dir: ${localMarkdownDir}`,
    "",
    "3) First command to run",
    command,
  ];

  if (missing.length > 0) {
    lines.push("");
    lines.push(`Missing setup: ${missing.join(", ")}`);
    lines.push(
      "Fill these in .env.local (or export them in your shell), then rerun.",
    );
  }

  return {
    text: `${lines.join("\n")}\n`,
    exitCode: setupStatus === "ready" ? 0 : 1,
  };
}

export async function runCli(argv, options = {}) {
  const analyzePostFn = options.analyzePostFn ?? analyzePost;
  const discoverTopicFn = options.discoverTopicFn ?? discoverTopic;
  const saveAnalysisFn = options.saveAnalysisFn ?? saveAnalysis;
  const saveAnalysisLocalFn =
    options.saveAnalysisLocalFn ?? saveAnalysisLocalLazy;
  const env = options.env ?? process.env;
  const writeStdout =
    options.writeStdout ?? ((content) => process.stdout.write(content));
  const writeStderr =
    options.writeStderr ?? ((content) => process.stderr.write(content));
  const version = getCliVersion(options.readPackageJson);

  try {
    const { positional, flags } = parseArgs(argv);
    const command = positional[0];

    if (flags.version) {
      writeStdout(`${version}\n`);
      return 0;
    }

    if (flags.help || !command) {
      writeStdout(`${renderHelp(version)}\n`);
      return 0;
    }

    if (command === "share") {
      throw new Error("Command `share` has been removed. Use `analyze`.");
    }

    if (command !== "analyze" && command !== "discover" && command !== "init") {
      throw new Error(`Unknown command: ${command}`);
    }

    if (command === "analyze") {
      const xUrl = flags.url;
      if (!xUrl) {
        throw new Error("Missing --url");
      }
      const storageFlag = flags.storage ?? null;
      const supportedStorage = ["convex", "local", "none"];
      if (storageFlag && !supportedStorage.includes(storageFlag)) {
        throw new Error(
          `Invalid --storage value: ${storageFlag}. Expected convex, local, or none.`,
        );
      }

      const analyzed = await analyzePostFn({ xUrl });
      const userId = flags["user-id"] ?? env.RABBITBRAIN_USER_ID ?? null;

      // Backward-compatible behavior: passing --user-id without --storage saves to Convex.
      const effectiveStorage = storageFlag ?? (userId ? "convex" : "none");
      let id = null;
      if (effectiveStorage === "convex") {
        if (!userId) {
          throw new Error("Missing --user-id for convex persistence");
        }
        id = await saveAnalysisFn({ userId, analyzed, env });
      } else if (effectiveStorage === "local") {
        const localUserId = userId ?? "local-cli-user";
        id = await saveAnalysisLocalFn({ userId: localUserId, analyzed, env });
      }

      writeStdout(
        `${JSON.stringify(
          {
            id,
            ...analyzed,
          },
          null,
          flags.pretty ? 2 : 0,
        )}\n`,
      );
      return 0;
    }

    if (command === "init") {
      const modeFlag = flags.mode ?? env.RABBITBRAIN_STORAGE ?? "local";
      if (modeFlag !== "local" && modeFlag !== "convex") {
        throw new Error(
          `Invalid --mode value: ${modeFlag}. Expected local or convex.`,
        );
      }

      const init = createInitOutput({ mode: modeFlag, env });
      writeStdout(init.text);
      return init.exitCode;
    }

    const topic = flags.topic;
    if (!topic) {
      throw new Error("Missing --topic");
    }

    const discovered = await discoverTopicFn({ topic });
    writeStdout(`${JSON.stringify(discovered, null, flags.pretty ? 2 : 0)}\n`);
    return 0;
  } catch (error) {
    writeStderr(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}
