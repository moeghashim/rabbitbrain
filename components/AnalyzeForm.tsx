"use client";

import { useEffect, useRef, useState } from "react";

type AnalysisResult = {
  id: string;
  xUrl: string;
  sharedAt: number;
  primaryPost: {
    id: string;
    username: string;
    name: string;
    text: string;
    tweet_url: string;
  };
};

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: (element?: HTMLElement | null) => void;
      };
    };
  }
}

export function AnalyzeForm({ canAnalyze }: { canAnalyze: boolean }) {
  const [xUrl, setXUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const embedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!result?.primaryPost.tweet_url || !embedRef.current) {
      return;
    }

    const render = () => {
      window.twttr?.widgets?.load(embedRef.current);
    };

    const existing = document.getElementById("x-widgets-script");
    if (existing) {
      render();
      return;
    }

    const script = document.createElement("script");
    script.id = "x-widgets-script";
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.onload = render;
    document.body.appendChild(script);
  }, [result?.primaryPost.tweet_url]);

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
          <div ref={embedRef}>
            <blockquote className="twitter-tweet" data-dnt="true">
              <a href={result.primaryPost.tweet_url}>{result.primaryPost.tweet_url}</a>
            </blockquote>
          </div>
        </div>
      ) : null}
    </section>
  );
}
