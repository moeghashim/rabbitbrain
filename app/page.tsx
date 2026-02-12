import Link from "next/link";
import { headers } from "next/headers";
import { AnalyzeForm } from "@/components/AnalyzeForm";
import { AuthActions } from "@/components/AuthActions";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  const hasAuthDatabase = Boolean(
    process.env.AUTH_DATABASE_URL ??
      process.env.DATABASE_URL ??
      process.env.POSTGRES_URL ??
      process.env.POSTGRES_PRISMA_URL
  );
  const twitterEnabled = Boolean(
    process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET && hasAuthDatabase
  );

  const identity = session?.user.email ?? session?.user.name ?? session?.user.id ?? "Guest";

  return (
    <main className="rb-page">
      <div className="rb-shell rb-grid-pattern">
        <div className="rb-glow rb-glow-lime" aria-hidden />
        <div className="rb-glow rb-glow-emerald" aria-hidden />

        <header className="rb-header">
          <div className="rb-brand-wrap">
            <div className="rb-brand-mark">R</div>
            <div>
              <div className="rb-brand-title">Rabbitbrain</div>
              <div className="rb-brand-subtitle">X Topic Intelligence</div>
            </div>
          </div>

          <nav className="rb-nav">
            <a href="#analyze">Analyze</a>
            <a href="#flow">Flow</a>
            <Link href="/history">History</Link>
          </nav>

          <div className="rb-header-actions">
            <div className="rb-status">
              <span className="rb-status-dot" />
              {session ? "Session Active" : "Awaiting Login"}
            </div>
            <AuthActions session={session} twitterEnabled={twitterEnabled} />
          </div>
        </header>

        <section className="rb-hero">
          <div>
            <div className="rb-kicker">[ LEARNING_TOPIC_PROTOCOL_V1 ]</div>
            <h1 className="rb-hero-title">
              SHARE. <span>ANALYZE.</span> LEARN.
            </h1>
            <p className="rb-hero-copy">
              Paste any X post and Rabbitbrain extracts the most relevant learning topic in one or
              two words using post context, related signals, and model reasoning.
            </p>
            <div className="rb-hero-cta">
              <a className="rb-btn rb-btn-primary" href="#analyze">
                Initialize Analysis
              </a>
              <Link className="rb-btn rb-btn-ghost" href="/history">
                View History
              </Link>
            </div>
          </div>

          <div className="rb-terminal-shell">
            <div className="rb-terminal-topbar">
              <span />
              <span />
              <span />
            </div>
            <div className="rb-terminal-content">
              <div>$ rabbitbrain --scan x-post</div>
              <div className="rb-terminal-accent">&gt; context enrichment ready</div>
              <div>&gt; topic classifier engaged</div>
              <div className="rb-terminal-bar">
                <div />
              </div>
              <div className="rb-terminal-foot">Active identity: {identity}</div>
            </div>
            <div className="rb-floating-card rb-floating-top">
              <div>TOPIC LATENCY</div>
              <strong>
                0.18<span>ms</span>
              </strong>
            </div>
            <div className="rb-floating-card rb-floating-bottom">
              <div>MODEL</div>
              <strong>grok-4-fast</strong>
            </div>
          </div>
        </section>

        <section id="analyze" className="rb-bento">
          <AnalyzeForm canAnalyze={Boolean(session)} />

          <article className="rb-panel rb-panel-info">
            <h3>Session Context</h3>
            <p className="rb-muted">Signed identity</p>
            <p className="rb-identity">{identity}</p>
            <div className="rb-mini-stats">
              <div>
                <span>Mode</span>
                <strong>{session ? "Authenticated" : "Guest"}</strong>
              </div>
              <div>
                <span>Storage</span>
                <strong>Convex</strong>
              </div>
            </div>
            <p className="rb-muted rb-tight">
              {twitterEnabled
                ? "Sign in with X to save analyses and view full personal history."
                : "Local auth is not configured yet. Add Twitter credentials and a database URL (AUTH_DATABASE_URL or DATABASE_URL)."}
            </p>
          </article>

          <article className="rb-lime-card">
            <p>PIPELINE</p>
            <h3>
              URL PARSE<br />
              ENRICH<br />
              CLASSIFY
            </h3>
          </article>

          <article id="flow" className="rb-panel rb-panel-flow">
            <h3>How Rabbitbrain Works</h3>
            <ol>
              <li>Validate X URL and resolve target post.</li>
              <li>Pull related context from author and topic signals.</li>
              <li>Classify into a normalized 1-2 word learning topic.</li>
              <li>Persist analysis for authenticated user history.</li>
            </ol>
          </article>
        </section>
      </div>

      <section className="rb-contrast-section">
        <div className="rb-contrast-grid">
          <div>
            <p className="rb-contrast-kicker">[ PRODUCT METHOD ]</p>
            <h2>Built for SaaS-Grade Reliability</h2>
          </div>
          <div className="rb-contrast-points">
            <article>
              <h4>Embedded Runtime</h4>
              <p>In-process X research integration, no per-request skill CLI dependency.</p>
            </article>
            <article>
              <h4>Upstream Sync</h4>
              <p>Automated weekly sync job opens PRs when x-research upstream changes.</p>
            </article>
            <article>
              <h4>Observable Pipeline</h4>
              <p>Deterministic API flow with explicit error contracts and typed persistence.</p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
