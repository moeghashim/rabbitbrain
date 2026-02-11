import { z } from "zod";
import type { Tweet } from "@/lib/xresearch/api";

const classifierOutputSchema = z.object({
  topic: z.string().min(1),
  confidence: z.number().min(0).max(1).optional()
});

const commonTopicMap: Array<{ topic: string; patterns: RegExp[] }> = [
  { topic: "AI Agents", patterns: [/\bagent(s)?\b/i, /workflow/i, /autonom/i] },
  { topic: "Prompt Engineering", patterns: [/\bprompt(s)?\b/i, /instruction/i, /context window/i] },
  { topic: "Model Evaluation", patterns: [/benchmark/i, /eval(s|uation)?/i, /leaderboard/i] },
  { topic: "Product Strategy", patterns: [/go-to-market/i, /positioning/i, /strategy/i] },
  { topic: "Developer Tools", patterns: [/sdk/i, /framework/i, /library/i, /tooling/i] },
  { topic: "Growth Marketing", patterns: [/funnel/i, /acquisition/i, /retention/i, /conversion/i] }
];

function toTitleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function normalizeTopic(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "General Learning";
  }

  const words = cleaned.split(" ").slice(0, 2);
  return toTitleCase(words.join(" "));
}

export function fallbackTopicFromText(text: string): string {
  for (const entry of commonTopicMap) {
    if (entry.patterns.some((pattern) => pattern.test(text))) {
      return entry.topic;
    }
  }

  const words = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 2);

  if (!words.length) {
    return "General Learning";
  }

  return toTitleCase(words.join(" "));
}

export async function classifyLearningTopic(args: {
  primary: Tweet;
  related: Tweet[];
}): Promise<{ topic: string; confidence: number; model: string }> {
  const model = process.env.XAI_MODEL ?? "grok-4-fast";
  const apiKey = process.env.XAI_API_KEY;
  const allText = [args.primary.text, ...args.related.map((tweet) => tweet.text)].join("\n\n");

  if (!apiKey) {
    return {
      topic: fallbackTopicFromText(allText),
      confidence: 0.45,
      model: `${model}-fallback`
    };
  }

  const prompt = `You classify X posts into learning topics.\nReturn JSON with keys {\"topic\": string, \"confidence\": number}.\nRules: topic must be one or two words, title case, no punctuation.`;

  const userPayload = {
    primaryPost: args.primary.text,
    relatedPosts: args.related.map((tweet) => tweet.text).slice(0, 8)
  };

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: JSON.stringify(userPayload) }
      ]
    })
  });

  if (!response.ok) {
    const fallback = fallbackTopicFromText(allText);
    return {
      topic: fallback,
      confidence: 0.5,
      model: `${model}-fallback`
    };
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    return {
      topic: fallbackTopicFromText(allText),
      confidence: 0.5,
      model: `${model}-fallback`
    };
  }

  try {
    const parsedJson = JSON.parse(content) as unknown;
    const validated = classifierOutputSchema.parse(parsedJson);

    return {
      topic: normalizeTopic(validated.topic),
      confidence: validated.confidence ?? 0.78,
      model
    };
  } catch {
    return {
      topic: fallbackTopicFromText(allText),
      confidence: 0.55,
      model: `${model}-fallback`
    };
  }
}
