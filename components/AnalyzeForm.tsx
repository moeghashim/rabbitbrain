"use client";

import { useState } from "react";

type AnalysisResult = {
  id: string;
  topic: string;
  confidence: number;
  primaryPost: {
    id: string;
    text: string;
    tweet_url: string;
  };
  relatedPosts: {
    id: string;
    text: string;
    tweet_url: string;
  }[];
  createdAt: number;
};

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
        <h2>Analyze Shared Post</h2>
        <p>Paste a public X URL to generate a 1-2 word learning topic.</p>
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
          <span>{canAnalyze ? "Results are saved to your history." : "Sign in to enable analysis."}</span>
        </div>
      </form>

      {error ? <p className="rb-error">{error}</p> : null}

      {result ? (
        <div className="rb-result-card">
          <div className="rb-result-top">
            <div>
              <p className="rb-result-label">Learning topic</p>
              <h3>{result.topic}</h3>
            </div>
            <div className="rb-confidence">
              <span>Confidence</span>
              <strong>{(result.confidence * 100).toFixed(0)}%</strong>
            </div>
          </div>

          <div className="rb-source-block">
            <p className="rb-result-label">Primary post</p>
            <p>{result.primaryPost.text}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
