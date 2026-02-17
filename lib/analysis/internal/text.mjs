import { STOPWORDS } from "./constants.mjs";

export function extractTweetId(xUrl) {
  const match = xUrl
    .trim()
    .match(/(?:x|twitter)\.com\/[A-Za-z0-9_]+\/status\/(\d+)/i);
  return match?.[1] ?? null;
}

export function extractKeywords(text, maxTerms = 8) {
  const words = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOPWORDS.has(word));

  const counts = new Map();
  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTerms)
    .map((entry) => entry[0]);
}

export function overlapScore(base, candidate) {
  const baseSet = new Set(extractKeywords(base, 20));
  const candidateSet = new Set(extractKeywords(candidate, 20));

  let overlap = 0;
  for (const token of candidateSet) {
    if (baseSet.has(token)) {
      overlap += 1;
    }
  }

  return overlap;
}

export function normalizeTopic(raw) {
  const cleaned = String(raw ?? "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) {
    return "General Learning";
  }

  return cleaned
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function fallbackTopicFromText(text) {
  const heuristics = [
    {
      topic: "AI Agents",
      patterns: [/\bagent(s)?\b/i, /workflow/i, /autonom/i],
    },
    {
      topic: "Prompt Engineering",
      patterns: [/\bprompt(s)?\b/i, /instruction/i, /context window/i],
    },
    {
      topic: "Model Evaluation",
      patterns: [/benchmark/i, /eval(s|uation)?/i, /leaderboard/i],
    },
    {
      topic: "Product Strategy",
      patterns: [/go-to-market/i, /positioning/i, /strategy/i],
    },
    {
      topic: "Developer Tools",
      patterns: [/sdk/i, /framework/i, /library/i, /tooling/i],
    },
    {
      topic: "Growth Marketing",
      patterns: [/funnel/i, /acquisition/i, /retention/i, /conversion/i],
    },
  ];

  for (const entry of heuristics) {
    if (entry.patterns.some((pattern) => pattern.test(text))) {
      return entry.topic;
    }
  }

  const tokens = extractKeywords(text, 2);
  if (!tokens.length) {
    return "General Learning";
  }
  return normalizeTopic(tokens.join(" "));
}

export function extractMentionHandles(text) {
  const matches = text.match(/@([A-Za-z0-9_]+)/g) ?? [];
  return [...new Set(matches.map((token) => token.slice(1)))];
}

export function hostnameFromUrl(raw) {
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function isLikelyArticleUrl(raw) {
  const host = hostnameFromUrl(raw);
  if (!host) {
    return false;
  }
  if (host === "x.com" || host === "twitter.com" || host.endsWith(".x.com")) {
    return false;
  }
  return true;
}
