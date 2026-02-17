import type { AnalysisHistoryItem } from "@/lib/convex";

function buildXSearchUrl(query: string): string {
  return `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query`;
}

function buildXFollowIntentUrl(username: string): string {
  return `https://x.com/intent/follow?screen_name=${encodeURIComponent(username)}`;
}

export function HistoryList({ analyses }: { analyses: AnalysisHistoryItem[] }) {
  if (!analyses.length) {
    return (
      <article className="rb-panel rb-empty-history">
        <h2>No analyses yet</h2>
        <p className="rb-muted">
          Analyze your first post from the main page and it will appear here.
        </p>
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
          {item.appAbout ? <p>{item.appAbout}</p> : null}
          <p>{item.primaryText}</p>
          <div className="rb-follow-actions rb-follow-actions-compact">
            <a
              className="rb-btn rb-btn-ghost"
              href={buildXFollowIntentUrl(item.authorUsername)}
              target="_blank"
              rel="noreferrer"
            >
              Follow @{item.authorUsername}
            </a>
            <a
              className="rb-btn rb-btn-ghost"
              href={buildXSearchUrl(item.topic)}
              target="_blank"
              rel="noreferrer"
            >
              Explore {item.topic}
            </a>
            <a
              className="rb-btn rb-btn-ghost"
              href={buildXSearchUrl(
                `from:${item.authorUsername} ${item.topic}`,
              )}
              target="_blank"
              rel="noreferrer"
            >
              Explore @{item.authorUsername} + {item.topic}
            </a>
          </div>
          <a href={item.xUrl} target="_blank" rel="noreferrer">
            Open original post
          </a>
        </article>
      ))}
    </div>
  );
}
