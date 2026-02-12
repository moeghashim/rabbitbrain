"use client";

import { useState } from "react";

type AnalysisResult = {
  id: string;
  xUrl: string;
  sharedAt: number;
  primaryPost: {
    id: string;
    username: string;
    name: string;
    profileImageUrl: string | null;
    verified: boolean;
    text: string;
    tweet_url: string;
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
        <h2>Share A Post</h2>
        <p>Paste a public X URL and save it to your account.</p>
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
            {loading ? "Sharing..." : "Share Post"}
          </button>
          <span>{canAnalyze ? "Shared posts are saved to your history." : "Sign in to share posts."}</span>
        </div>
      </form>

      {error ? <p className="rb-error">{error}</p> : null}

      {result ? (
        <div className="rb-result-card">
          <div className="rb-result-top">
            <div>
              <p className="rb-result-label">Shared</p>
              <h3>Post saved to your history</h3>
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
        </div>
      ) : null}
    </section>
  );
}
