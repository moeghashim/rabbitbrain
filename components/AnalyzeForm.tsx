"use client";

import { useState } from "react";

type AnalysisResult = {
  id: string;
  xUrl: string;
  analyzedAt: number;
  primaryPost: {
    id: string;
    username: string;
    name: string;
    profileImageUrl: string | null;
    verified: boolean;
    text: string;
    tweet_url: string;
  };
  analysis: {
    appAbout: string;
    topic: string;
    confidence: number;
    model: string;
  };
  recommendations: {
    similarPeople: Array<{
      username: string;
      name: string;
      reason: string;
      score: number;
    }>;
    topicsToFollow: Array<{
      topic: string;
      reason: string;
      score: number;
    }>;
    creator: {
      username: string;
      shouldFollow: boolean;
      reason: string;
      impactScore: number;
    };
  };
};

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
  const [xUrl, setXUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);

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

  return (
    <section className="rb-panel rb-panel-analyze">
      <div className="rb-panel-head">
        <h2>Analyze A Post</h2>
        <p>Paste a public X URL and get analysis and follow recommendations.</p>
      </div>

      <form className="rb-form" onSubmit={onSubmit}>
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
    </section>
  );
}
