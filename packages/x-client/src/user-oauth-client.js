import { defaultWarningReporter, readPaginationToken, readTweetArrayPayload } from "./client.js";
import { toXProviderError } from "./provider-errors.js";
export class XUserOAuthClient {
    accessToken;
    fetchFn;
    warningReporter;
    constructor({ accessToken, fetchFn, warningReporter = defaultWarningReporter, }) {
        this.accessToken = accessToken.trim();
        this.fetchFn = fetchFn ?? fetch;
        this.warningReporter = warningReporter;
    }
    createBookmarksUrl(userId, limit, nextToken) {
        const url = new URL(`https://api.x.com/2/users/${encodeURIComponent(userId)}/bookmarks`);
        url.searchParams.set("max_results", String(Math.max(5, Math.min(limit, 100))));
        url.searchParams.set("expansions", "author_id,attachments.media_keys");
        url.searchParams.set("tweet.fields", "author_id,attachments,public_metrics,created_at,conversation_id,referenced_tweets");
        url.searchParams.set("user.fields", "id,username,name,profile_image_url");
        url.searchParams.set("media.fields", "type,url,preview_image_url,alt_text,width,height");
        if (nextToken) {
            url.searchParams.set("pagination_token", nextToken);
        }
        return url;
    }
    async requestJson(url) {
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
    async getBookmarkedPostsByUserId(userId, limit, nextToken) {
        const responseBody = await this.requestJson(this.createBookmarksUrl(userId, limit, nextToken));
        return {
            tweets: readTweetArrayPayload(responseBody, this.warningReporter).slice(0, Math.max(1, limit)),
            nextToken: readPaginationToken(responseBody),
        };
    }
}
//# sourceMappingURL=user-oauth-client.js.map