const TWEET_STATUS_PATH_PATTERN = /\/status\/(\d+)/i;

export function isTweetStatusPath(value: string): boolean {
	return TWEET_STATUS_PATH_PATTERN.test(value);
}

export function normalizeTweetUrl(value: string): string | null {
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return null;
	}

	try {
		const url = new URL(trimmed, "https://x.com");
		if (url.hostname !== "x.com") {
			return null;
		}
		const match = url.pathname.match(TWEET_STATUS_PATH_PATTERN);
		if (!match?.[1]) {
			return null;
		}
		const pathPrefix = url.pathname.slice(0, url.pathname.indexOf(`/status/${match[1]}`));
		if (pathPrefix.length === 0) {
			return null;
		}
		return `https://x.com${pathPrefix}/status/${match[1]}`;
	} catch {
		return null;
	}
}

export function resolveTweetUrlFromArticle(article: Element): string | null {
	const links = article.querySelectorAll<HTMLAnchorElement>("a[href*='/status/']");

	for (const link of links) {
		const href = normalizeTweetUrl(link.href);
		if (href) {
			return href;
		}
	}

	return null;
}
