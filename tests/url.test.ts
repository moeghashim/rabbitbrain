import { describe, expect, test } from "vitest";
import { extractTweetId, isValidXPostUrl } from "@/lib/xresearch/url";

describe("extractTweetId", () => {
  test("extracts tweet id from x.com url", () => {
    expect(extractTweetId("https://x.com/someone/status/1234567890")).toBe("1234567890");
  });

  test("extracts tweet id from twitter.com url with query", () => {
    expect(extractTweetId("https://twitter.com/dev/status/99887766?s=20")).toBe("99887766");
  });

  test("returns null for invalid url", () => {
    expect(extractTweetId("https://x.com/home")).toBeNull();
    expect(isValidXPostUrl("https://x.com/home")).toBe(false);
  });
});
