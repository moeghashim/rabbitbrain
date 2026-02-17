export function buildXSearchUrl(query) {
  return `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query`;
}

function buildXFollowIntentUrl(username) {
  return `https://x.com/intent/follow?screen_name=${encodeURIComponent(username)}`;
}

export function buildFollowActions({ username, topic }) {
  const trimmedTopic = String(topic ?? "").trim();
  const trimmedUsername = String(username ?? "")
    .trim()
    .replace(/^@/, "");

  const topicQuery = trimmedTopic || "topic";
  const userTopicQuery =
    trimmedUsername && trimmedTopic
      ? `from:${trimmedUsername} ${trimmedTopic}`
      : topicQuery;

  return {
    topic: {
      topic: trimmedTopic || topicQuery,
      query: topicQuery,
      url: buildXSearchUrl(topicQuery),
    },
    user: {
      username: trimmedUsername || username,
      url: trimmedUsername
        ? buildXFollowIntentUrl(trimmedUsername)
        : "https://x.com",
    },
    userTopic: {
      username: trimmedUsername || username,
      topic: trimmedTopic || topicQuery,
      query: userTopicQuery,
      url: buildXSearchUrl(userTopicQuery),
    },
  };
}
