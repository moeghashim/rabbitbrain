import { defaultWarningReporter, readPaginationToken, readTweetArrayPayload } from "./client.js";
import { toXProviderError } from "./provider-errors.js";
import type { FetchLike, TweetPage, XProviderWarningReporter } from "./types.js";

export class XUserOAuthClient {
	private readonly accessToken: string;
	private readonly fetchFn: FetchLike;
	private readonly warningReporter: XProviderWarningReporter;

	constructor({
		accessToken,
		fetchFn,
		warningReporter = defaultWarningReporter,
	}: {
		accessToken: string;
		fetchFn?: FetchLike;
		warningReporter?: XProviderWarningReporter;
	}) {
		this.accessToken = accessToken.trim();
		this.fetchFn = fetchFn ?? (fetch as unknown as FetchLike);
		this.warningReporter = warningReporter;
	}

	private createBookmarksUrl(userId: string, limit: number, nextToken?: string): URL {
		const url = new URL(`https://api.x.com/2/users/${encodeURIComponent(userId)}/bookmarks`);
		url.searchParams.set("max_results", String(Math.max(5, Math.min(limit, 100))));
		url.searchParams.set("expansions", "author_id,attachments.media_keys");
		url.searchParams.set(
			"tweet.fields",
			"author_id,attachments,public_metrics,created_at,conversation_id,referenced_tweets",
		);
		url.searchParams.set("user.fields", "id,username,name,profile_image_url");
		url.searchParams.set("media.fields", "type,url,preview_image_url,alt_text,width,height");
		if (nextToken) {
			url.searchParams.set("pagination_token", nextToken);
		}
		return url;
	}

	private async requestJson(url: URL): Promise<unknown> {
		const response = await this.fetchFn(url.toString(), {
			method: "GET",
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
			},
		});
		if (!response.ok) {
			throw toXProviderError(response.status, await response.text());
		}
		return await response.json();
	}

	async getBookmarkedPostsByUserId(userId: string, limit: number, nextToken?: string): Promise<TweetPage> {
		const responseBody = await this.requestJson(this.createBookmarksUrl(userId, limit, nextToken));
		return {
			tweets: readTweetArrayPayload(responseBody, this.warningReporter).slice(0, Math.max(1, limit)),
			nextToken: readPaginationToken(responseBody),
		};
	}
}
