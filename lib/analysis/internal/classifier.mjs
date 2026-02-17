import { fallbackTopicFromText, normalizeTopic } from "./text.mjs";

export async function classifyTopicAndSummary(primary, related) {
  const model = process.env.XAI_MODEL ?? "grok-4-fast";
  const apiKey = process.env.XAI_API_KEY;
  const allText = [primary.text, ...related.map((tweet) => tweet.text)].join(
    "\n\n",
  );

  const fallbackTopic = fallbackTopicFromText(allText);
  const fallbackSummary = `This post is mainly about ${fallbackTopic.toLowerCase()} and practical takeaways from current discussion on X.`;

  if (!apiKey) {
    return {
      topic: fallbackTopic,
      appAbout: fallbackSummary,
      confidence: 0.45,
      model: `${model}-fallback`,
    };
  }

  const prompt = [
    "Analyze the primary X post and related context.",
    "Return JSON with keys:",
    '{"topic": string, "appAbout": string, "confidence": number}',
    "Rules:",
    "- topic must be one or two words, title case.",
    "- appAbout must be one sentence for app integrators.",
    "- confidence must be 0..1",
  ].join("\n");

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: JSON.stringify({
            primaryPost: primary.text,
            relatedPosts: related.map((tweet) => tweet.text).slice(0, 8),
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    return {
      topic: fallbackTopic,
      appAbout: fallbackSummary,
      confidence: 0.5,
      model: `${model}-fallback`,
    };
  }

  try {
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Missing content");
    }

    const parsed = JSON.parse(content);
    const topic = normalizeTopic(parsed.topic ?? fallbackTopic);
    const appAbout =
      String(parsed.appAbout ?? fallbackSummary).trim() || fallbackSummary;
    const confidence = Math.max(
      0,
      Math.min(1, Number(parsed.confidence ?? 0.72)),
    );

    return {
      topic,
      appAbout,
      confidence,
      model,
    };
  } catch {
    return {
      topic: fallbackTopic,
      appAbout: fallbackSummary,
      confidence: 0.55,
      model: `${model}-fallback`,
    };
  }
}
