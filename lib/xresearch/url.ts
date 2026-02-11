const X_POST_REGEX = /(?:x|twitter)\.com\/[A-Za-z0-9_]+\/status\/(\d+)/i;

export function extractTweetId(xUrl: string): string | null {
  if (!xUrl) {
    return null;
  }

  const trimmed = xUrl.trim();
  const match = trimmed.match(X_POST_REGEX);
  return match?.[1] ?? null;
}

export function isValidXPostUrl(xUrl: string): boolean {
  return extractTweetId(xUrl) !== null;
}
