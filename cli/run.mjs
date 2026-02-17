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
    "  CONVEX_URL         Required only when --user-id is provided",
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

export async function runCli(argv, options = {}) {
  const analyzePostFn = options.analyzePostFn ?? analyzePost;
  const discoverTopicFn = options.discoverTopicFn ?? discoverTopic;
  const saveAnalysisFn = options.saveAnalysisFn ?? saveAnalysis;
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

    if (command !== "analyze" && command !== "discover") {
      throw new Error(`Unknown command: ${command}`);
    }

    if (command === "analyze") {
      const xUrl = flags.url;
      if (!xUrl) {
        throw new Error("Missing --url");
      }

      const analyzed = await analyzePostFn({ xUrl });
      const userId = flags["user-id"] ?? null;
      const id = userId
        ? await saveAnalysisFn({ userId, analyzed, env })
        : null;

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
