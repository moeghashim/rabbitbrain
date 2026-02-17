import { describe, expect, test } from "vitest";
import { fallbackTopicFromText, normalizeTopic } from "@/lib/classifier/topic";

describe("normalizeTopic", () => {
  test("keeps one or two words and title-cases them", () => {
    expect(normalizeTopic("prompt engineering techniques")).toBe(
      "Prompt Engineering",
    );
    expect(normalizeTopic("AI")).toBe("Ai");
  });

  test("falls back for empty topic", () => {
    expect(normalizeTopic("!!!")).toBe("General Learning");
  });
});

describe("fallbackTopicFromText", () => {
  test("maps common agent language", () => {
    expect(fallbackTopicFromText("This workflow uses multiple AI agents")).toBe(
      "AI Agents",
    );
  });

  test("returns generated fallback when no strong pattern", () => {
    expect(
      fallbackTopicFromText("knowledge transfer and mentorship loops"),
    ).toBe("Knowledge Transfer");
  });
});
