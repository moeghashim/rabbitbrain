import { getTweet, type Tweet } from "@/lib/xresearch/api";
import { getRelatedPosts } from "@/lib/xresearch/enrich";

export interface XResearchProvider {
  getPrimaryPost(tweetId: string): Promise<Tweet | null>;
  getRelatedContext(primaryPost: Tweet): Promise<Tweet[]>;
}

/**
 * SaaS runtime integration: use adapted x-research logic directly in-process.
 * This avoids per-request shelling/agent-runtime dependencies in production.
 */
export const embeddedXResearchProvider: XResearchProvider = {
  async getPrimaryPost(tweetId: string): Promise<Tweet | null> {
    return getTweet(tweetId);
  },
  async getRelatedContext(primaryPost: Tweet): Promise<Tweet[]> {
    return getRelatedPosts(primaryPost);
  }
};
