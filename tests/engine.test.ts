import { describe, expect, test } from "vitest";
import { extractTweetId } from "@/lib/analysis/engine.mjs";

describe("analysis engine URL extraction", () => {
  test("extracts tweet id from x.com URL", () => {
    expect(extractTweetId("https://x.com/someone/status/1234567890")).toBe("1234567890");
  });

  test("returns null for invalid post URL", () => {
    expect(extractTweetId("https://x.com/someone")).toBeNull();
  });
});
