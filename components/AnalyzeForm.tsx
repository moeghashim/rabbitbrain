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
    <div className="card">
      <h2>Analyze a Post</h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="xUrl" className="muted">
          X post URL
        </label>
        <input
          id="xUrl"
          type="url"
          required
          placeholder="https://x.com/user/status/123..."
          value={xUrl}
          onChange={(event) => setXUrl(event.target.value)}
          style={{ marginTop: "0.35rem", marginBottom: "0.7rem" }}
        />
        <button disabled={loading}>{loading ? "Analyzing..." : "Analyze"}</button>
      </form>

      {error ? (
        <p style={{ color: "#9d2121", marginTop: "0.8rem" }}>{error}</p>
      ) : null}

      {result ? (
        <div style={{ marginTop: "1rem" }}>
          <h3 style={{ marginBottom: "0.45rem" }}>Topic: {result.topic}</h3>
          <p className="muted">Confidence: {(result.confidence * 100).toFixed(0)}%</p>
          <p>
            <strong>Primary:</strong> {result.primaryPost.text}
          </p>
          <p className="muted">Related context posts: {result.relatedPosts.length}</p>
        </div>
      ) : null}
    </div>
  );
}
