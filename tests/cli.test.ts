import { describe, expect, test, vi } from "vitest";
import { runCli } from "@/cli/run.mjs";

type AnalyzeResult = {
  xUrl: string;
  analyzedAt: number;
  analysis: {
    topic: string;
    appAbout: string;
    confidence: number;
    model: string;
  };
  recommendations: {
    similarPeople: Array<{
      username: string;
      name: string;
      score: number;
      reason: string;
    }>;
    topicsToFollow: Array<{ topic: string; score: number; reason: string }>;
    creator: {
      username: string;
      shouldFollow: boolean;
      impactScore: number;
      reason: string;
    };
  };
  internal: {
    tweetId: string;
    authorUsername: string;
    primaryText: string;
    relatedTexts: string[];
  };
};

function createOutputCapture() {
  let stdout = "";
  let stderr = "";

  return {
    writeStdout: (value: string) => {
      stdout += value;
    },
    writeStderr: (value: string) => {
      stderr += value;
    },
    getStdout: () => stdout,
    getStderr: () => stderr,
  };
}

function buildAnalyzeResult(
  overrides: Partial<AnalyzeResult> = {},
): AnalyzeResult {
  return {
    xUrl: "https://x.com/dev/status/123",
    analyzedAt: Date.now(),
    analysis: {
      topic: "AI Agents",
      appAbout: "A short app summary.",
      confidence: 0.8,
      model: "grok-4-fast",
    },
    recommendations: {
      similarPeople: [],
      topicsToFollow: [],
      creator: {
        username: "dev",
        shouldFollow: true,
        impactScore: 55,
        reason: "High topic engagement.",
      },
    },
    internal: {
      tweetId: "123",
      authorUsername: "dev",
      primaryText: "hello",
      relatedTexts: [],
    },
    ...overrides,
  };
}

describe("runCli", () => {
  test("prints help when no command is provided", async () => {
    const output = createOutputCapture();
    const code = await runCli([], output);

    expect(code).toBe(0);
    expect(output.getStdout()).toContain("Usage:");
    expect(output.getStderr()).toBe("");
  });

  test("returns error for unknown command", async () => {
    const output = createOutputCapture();
    const code = await runCli(["wat"], output);

    expect(code).toBe(1);
    expect(output.getStderr()).toContain("Unknown command");
  });

  test("returns error for missing analyze url", async () => {
    const output = createOutputCapture();
    const code = await runCli(["analyze"], output);

    expect(code).toBe(1);
    expect(output.getStderr()).toContain("Missing --url");
  });

  test("prints analyze JSON output", async () => {
    const output = createOutputCapture();
    const analyzePostFn = vi.fn().mockResolvedValue(buildAnalyzeResult());
    const saveAnalysisFn = vi.fn();

    const code = await runCli(
      ["analyze", "--url", "https://x.com/dev/status/123"],
      {
        ...output,
        analyzePostFn,
        saveAnalysisFn,
      },
    );

    expect(code).toBe(0);
    const parsed = JSON.parse(output.getStdout());
    expect(parsed.id).toBeNull();
    expect(parsed.analysis.topic).toBe("AI Agents");
    expect(saveAnalysisFn).not.toHaveBeenCalled();
  });

  test("fails when optional persistence path errors", async () => {
    const output = createOutputCapture();
    const analyzePostFn = vi.fn().mockResolvedValue(buildAnalyzeResult());
    const saveAnalysisFn = vi.fn().mockRejectedValue(new Error("Convex down"));

    const code = await runCli(
      [
        "analyze",
        "--url",
        "https://x.com/dev/status/123",
        "--user-id",
        "user_1",
      ],
      {
        ...output,
        analyzePostFn,
        saveAnalysisFn,
      },
    );

    expect(code).toBe(1);
    expect(output.getStderr()).toContain("Convex down");
  });

  test("prints discovery output", async () => {
    const output = createOutputCapture();
    const discoverTopicFn = vi
      .fn()
      .mockResolvedValue({ topic: "AI Agents", results: { users: [] } });

    const code = await runCli(["discover", "--topic", "ai agents"], {
      ...output,
      discoverTopicFn,
    });

    expect(code).toBe(0);
    const parsed = JSON.parse(output.getStdout());
    expect(parsed.topic).toBe("AI Agents");
  });
});
