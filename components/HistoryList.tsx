import type { AnalysisHistoryItem } from "@/lib/convex";

export function HistoryList({ analyses }: { analyses: AnalysisHistoryItem[] }) {
  if (!analyses.length) {
    return (
      <article className="rb-panel rb-empty-history">
        <h2>No shared posts yet</h2>
        <p className="rb-muted">Share your first post from the main page and it will appear here.</p>
      </article>
    );
  }

  return (
    <div className="rb-history-stack">
      {analyses.map((item) => (
        <article key={item._id} className="rb-panel rb-history-item">
          <div className="rb-history-item-head">
            <strong>{item.topic}</strong>
            <span>{new Date(item.createdAt).toLocaleString()}</span>
          </div>
          <p>{item.primaryText}</p>
          <a href={item.xUrl} target="_blank" rel="noreferrer">
            Open original post
          </a>
        </article>
      ))}
    </div>
  );
}
