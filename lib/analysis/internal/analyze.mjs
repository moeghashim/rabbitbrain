import { ANALYZE_OUTPUT_VERSION } from "./constants.mjs";
import { buildFollowActions } from "./follow.mjs";
import {
  computeCreatorAnalysis,
  computeSimilarPeople,
  computeTopicsToFollow,
} from "./recommendations.mjs";
import { getRelatedPosts } from "./related.mjs";
import { extractMentionHandles, extractTweetId } from "./text.mjs";
import { classifyTopicAndSummary } from "./classifier.mjs";
import { fetchPrimaryPost } from "./x-api.mjs";

export async function analyzePost({ xUrl }) {
  const tweetId = extractTweetId(xUrl);
  if (!tweetId) {
    const error = new Error("Invalid X post URL");
    error.code = "INVALID_URL";
    throw error;
  }

  const primaryPost = await fetchPrimaryPost(tweetId);
  if (!primaryPost) {
    const error = new Error("Post not found");
    error.code = "NOT_FOUND";
    throw error;
  }

  const relatedPosts = await getRelatedPosts(primaryPost);
  const analyzedAt = Date.now();
  const analysis = await classifyTopicAndSummary(primaryPost, relatedPosts);
  const similarPeople = computeSimilarPeople(primaryPost, relatedPosts, 5);
  const mentionFallback = extractMentionHandles(primaryPost.text)
    .filter(
      (handle) => handle.toLowerCase() !== primaryPost.username.toLowerCase(),
    )
    .slice(0, 5)
    .map((handle) => ({
      username: handle,
      name: handle,
      score: 1,
      reason: "Mentioned directly in the post as a likely relevant account.",
    }));

  const mergedPeople = [...similarPeople];
  for (const candidate of mentionFallback) {
    if (
      !mergedPeople.some(
        (entry) =>
          entry.username.toLowerCase() === candidate.username.toLowerCase(),
      )
    ) {
      mergedPeople.push(candidate);
    }
  }

  const topicsToFollow = computeTopicsToFollow(primaryPost, relatedPosts, 5);
  if (
    !topicsToFollow.some(
      (entry) => entry.topic.toLowerCase() === analysis.topic.toLowerCase(),
    )
  ) {
    topicsToFollow.unshift({
      topic: analysis.topic,
      score: 5,
      reason: "Primary post's core topic from classifier output.",
    });
  }

  const creator = computeCreatorAnalysis(primaryPost, relatedPosts);

  return {
    version: ANALYZE_OUTPUT_VERSION,
    xUrl,
    analyzedAt,
    primaryPost: {
      id: primaryPost.id,
      username: primaryPost.username,
      name: primaryPost.name,
      profileImageUrl: primaryPost.profile_image_url,
      verified: primaryPost.verified,
      text: primaryPost.text,
      tweet_url: primaryPost.tweet_url,
    },
    analysis,
    follow: buildFollowActions({
      username: primaryPost.username,
      topic: analysis.topic,
    }),
    recommendations: {
      similarPeople: mergedPeople.slice(0, 5),
      topicsToFollow: topicsToFollow.slice(0, 5),
      creator,
    },
    internal: {
      tweetId: primaryPost.id,
      authorUsername: primaryPost.username,
      primaryText: primaryPost.text,
      relatedTexts: relatedPosts.map((tweet) => tweet.text),
    },
  };
}
