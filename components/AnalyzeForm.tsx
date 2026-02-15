"use client";

import { useState } from "react";
import type { AnalyzeResult, DiscoverTopicResult } from "@/lib/analysis/engine.mjs";

type AnalysisResult = AnalyzeResult & { id: string };
type DiscoverResult = DiscoverTopicResult & { id: string | null };

function normalizeTextUrl(raw: string): string {
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  return `https://${raw}`;
}

function renderPostText(text: string) {
  const domainPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z]{2,})+$/i;
  const urlPattern = /^https?:\/\/\S+$/i;

  return text.split("\n").map((line, lineIndex) => (
    <p key={`${line}-${lineIndex}`}>
      {line.split(/(\s+)/).map((token, tokenIndex) => {
        if (!token.trim()) {
          return token;
        }
        if (urlPattern.test(token) || domainPattern.test(token)) {
          const href = normalizeTextUrl(token);
          return (
            <a key={`${token}-${tokenIndex}`} href={href} target="_blank" rel="noreferrer">
              {token}
            </a>
          );
        }
        return token;
      })}
    </p>
  ));
}

export function AnalyzeForm({ canAnalyze }: { canAnalyze: boolean }) {
  const [mode, setMode] = useState<"analyze" | "discover">("analyze");
  const [xUrl, setXUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [discovered, setDiscovered] = useState<DiscoverResult | null>(null);

  const onSubmitAnalyze = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setDiscovered(null);

    if (!canAnalyze) {
      setError("Sign in first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ xUrl })
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Analysis failed");
        return;
      }

      setResult(payload);
    } catch {
      setError("Network error while analyzing.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitDiscover = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setDiscovered(null);

    if (!canAnalyze) {
      setError("Sign in first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/discover", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ topic })
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Discovery failed");
        return;
      }

      setDiscovered(payload);
    } catch {
      setError("Network error while discovering.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rb-panel rb-panel-analyze">
      <div className="rb-panel-head">
        <h2>{mode === "analyze" ? "Analyze A Post" : "Discover A Topic"}</h2>
        <p>
          {mode === "analyze"
            ? "Paste a public X URL and get analysis and follow recommendations."
            : "Share a topic and get the best users, posts, and linked articles about it."}
        </p>
      </div>

      <div className="rb-mode-tabs" role="tablist" aria-label="Mode">
        <button
          type="button"
          className={`rb-tab ${mode === "analyze" ? "rb-tab-active" : ""}`}
          onClick={() => {
            setMode("analyze");
            setError(null);
            setDiscovered(null);
          }}
        >
          Analyze
        </button>
        <button
          type="button"
          className={`rb-tab ${mode === "discover" ? "rb-tab-active" : ""}`}
          onClick={() => {
            setMode("discover");
            setError(null);
            setResult(null);
          }}
        >
          Discover
        </button>
      </div>

      {mode === "analyze" ? (
        <form className="rb-form" onSubmit={onSubmitAnalyze}>
          <label htmlFor="xUrl">X post URL</label>
          <input
            id="xUrl"
            type="url"
            required
            placeholder="https://x.com/user/status/123..."
            value={xUrl}
            onChange={(event) => setXUrl(event.target.value)}
          />
          <div className="rb-form-actions">
            <button type="submit" className="rb-btn rb-btn-primary" disabled={loading}>
              {loading ? "Analyzing..." : "Analyze Post"}
            </button>
            <span>{canAnalyze ? "Analyses are saved to your history." : "Sign in to analyze posts."}</span>
          </div>
        </form>
      ) : (
        <form className="rb-form" onSubmit={onSubmitDiscover}>
          <label htmlFor="topic">Topic</label>
          <input
            id="topic"
            type="text"
            required
            placeholder="AI agents, chip design, NYC restaurants..."
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          />
          <div className="rb-form-actions">
            <button type="submit" className="rb-btn rb-btn-primary" disabled={loading}>
              {loading ? "Searching..." : "Discover Topic"}
            </button>
            <span>{canAnalyze ? "Discovery uses your X API token." : "Sign in to discover topics."}</span>
          </div>
        </form>
      )}

      {error ? <p className="rb-error">{error}</p> : null}

      {result ? (
        <div className="rb-result-card">
          <div className="rb-result-top">
            <div>
              <p className="rb-result-label">Analyzed</p>
              <h3>Post analyzed and saved to your history</h3>
            </div>
          </div>

          <div className="rb-shared-post">
            <div className="rb-shared-post-head">
              {result.primaryPost.profileImageUrl ? (
                <div
                  className="rb-shared-post-avatar"
                  role="img"
                  aria-label={`${result.primaryPost.name} profile`}
                  style={{ backgroundImage: `url(${result.primaryPost.profileImageUrl})` }}
                />
              ) : (
                <div className="rb-shared-post-avatar rb-shared-post-avatar-fallback">
                  {result.primaryPost.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <div className="rb-shared-post-name-row">
                  <strong>{result.primaryPost.name}</strong>
                  {result.primaryPost.verified ? <span className="rb-verified-badge">✓</span> : null}
                </div>
                <p className="rb-shared-post-handle">@{result.primaryPost.username}</p>
              </div>
            </div>

            <div className="rb-shared-post-text">{renderPostText(result.primaryPost.text)}</div>

            <div className="rb-follow-actions">
              <a
                className="rb-btn rb-btn-ghost"
                href={result.follow.user.url}
                target="_blank"
                rel="noreferrer"
              >
                Follow @{result.follow.user.username}
              </a>
              <a
                className="rb-btn rb-btn-ghost"
                href={result.follow.topic.url}
                target="_blank"
                rel="noreferrer"
              >
                Explore {result.follow.topic.topic}
              </a>
              <a
                className="rb-btn rb-btn-ghost"
                href={result.follow.userTopic.url}
                target="_blank"
                rel="noreferrer"
              >
                Explore @{result.follow.userTopic.username} + {result.follow.userTopic.topic}
              </a>
            </div>

            <a className="rb-shared-post-link" href={result.primaryPost.tweet_url} target="_blank" rel="noreferrer">
              Open on X
            </a>
          </div>

          <div className="rb-history-stack">
            <article className="rb-panel rb-history-item">
              <div className="rb-history-item-head">
                <strong>{result.analysis.topic}</strong>
                <span>{Math.round(result.analysis.confidence * 100)}% confidence</span>
              </div>
              <p>{result.analysis.appAbout}</p>
            </article>

            <article className="rb-panel rb-history-item">
              <div className="rb-history-item-head">
                <strong>People to follow</strong>
              </div>
              <ul>
                {result.recommendations.similarPeople.length ? (
                  result.recommendations.similarPeople.map((person) => (
                    <li key={person.username}>
                      <strong>@{person.username}</strong>: {person.reason} ({person.score})
                    </li>
                  ))
                ) : (
                  <li>No strong similar-person candidates found.</li>
                )}
              </ul>
            </article>

            <article className="rb-panel rb-history-item">
              <div className="rb-history-item-head">
                <strong>Topics to follow</strong>
              </div>
              <ul>
                {result.recommendations.topicsToFollow.length ? (
                  result.recommendations.topicsToFollow.map((topic) => (
                    <li key={topic.topic}>
                      <strong>{topic.topic}</strong>: {topic.reason} ({topic.score})
                    </li>
                  ))
                ) : (
                  <li>No strong topic candidates found.</li>
                )}
              </ul>
            </article>

            <article className="rb-panel rb-history-item">
              <div className="rb-history-item-head">
                <strong>Creator analysis</strong>
              </div>
              <p>
                <strong>@{result.recommendations.creator.username}</strong>:{" "}
                {result.recommendations.creator.reason}
              </p>
              <p>
                Follow: {result.recommendations.creator.shouldFollow ? "Yes" : "No"} | Impact score:{" "}
                {result.recommendations.creator.impactScore}
              </p>
            </article>
          </div>
        </div>
      ) : null}

      {discovered ? (
        <div className="rb-result-card">
          <div className="rb-result-top">
            <div>
              <p className="rb-result-label">Discovered</p>
              <h3>Top results for {discovered.topic}</h3>
            </div>
          </div>

          <div className="rb-follow-actions">
            <a className="rb-btn rb-btn-ghost" href={discovered.follow.topic.url} target="_blank" rel="noreferrer">
              Explore on X
            </a>
          </div>

          <div className="rb-history-stack">
            <article className="rb-panel rb-history-item">
              <div className="rb-history-item-head">
                <strong>Best users</strong>
                <span>{discovered.results.users.length} found</span>
              </div>
              <ul>
                {discovered.results.users.length ? (
                  discovered.results.users.map((user) => (
                    <li key={user.username}>
                      <strong>@{user.username}</strong>: {user.reason} ({user.score})
                    </li>
                  ))
                ) : (
                  <li>No strong user candidates found.</li>
                )}
              </ul>
            </article>

            <article className="rb-panel rb-history-item">
              <div className="rb-history-item-head">
                <strong>Best posts</strong>
                <span>{discovered.results.posts.length} found</span>
              </div>
              <ul>
                {discovered.results.posts.length ? (
                  discovered.results.posts.map((post) => (
                    <li key={post.id}>
                      <strong>@{post.username}</strong>: {post.text.slice(0, 140)}
                      {"... "}
                      <a href={post.tweet_url} target="_blank" rel="noreferrer">
                        Open
                      </a>{" "}
                      ({post.score})
                    </li>
                  ))
                ) : (
                  <li>No strong post candidates found.</li>
                )}
              </ul>
            </article>

            <article className="rb-panel rb-history-item">
              <div className="rb-history-item-head">
                <strong>Linked articles</strong>
                <span>{discovered.results.articles.length} found</span>
              </div>
              <ul>
                {discovered.results.articles.length ? (
                  discovered.results.articles.map((article) => (
                    <li key={article.url}>
                      <strong>{article.domain}</strong>:{" "}
                      <a href={article.url} target="_blank" rel="noreferrer">
                        {article.url}
                      </a>{" "}
                      ({article.score})
                    </li>
                  ))
                ) : (
                  <li>No strong article candidates found.</li>
                )}
              </ul>
            </article>
          </div>
        </div>
      ) : null}
    </section>
  );
}
