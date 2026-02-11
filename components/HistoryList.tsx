import type { AnalysisHistoryItem } from "@/lib/convex";

export function HistoryList({ analyses }: { analyses: AnalysisHistoryItem[] }) {
  if (!analyses.length) {
    return <p className="muted">No analyses yet.</p>;
  }

  return (
    <div className="row" style={{ flexDirection: "column" }}>
      {analyses.map((item) => (
        <article key={item._id} className="card">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <strong>{item.topic}</strong>
            <span className="muted">{new Date(item.createdAt).toLocaleString()}</span>
          </div>
          <p className="muted">Confidence: {(item.confidence * 100).toFixed(0)}%</p>
          <p>{item.primaryText}</p>
          <a href={item.xUrl} target="_blank" rel="noreferrer">
            Open original post
          </a>
        </article>
      ))}
    </div>
  );
}
