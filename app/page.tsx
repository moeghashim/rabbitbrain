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

        <header className="rb-header">
          <div className="rb-brand-wrap">
            <div className="rb-brand-mark">R</div>
            <div>
              <div className="rb-brand-title">Rabbitbrain</div>
              <div className="rb-brand-subtitle">Simple Post Sharing</div>
            </div>
          </div>

          <nav className="rb-nav">
            <a href="#share">Share</a>
            <Link href="/history">History</Link>
          </nav>

          <div className="rb-header-actions">
            <div className="rb-status">
              <span className="rb-status-dot" />
              {session ? `Signed in as ${identity}` : "Awaiting Login"}
            </div>
            <AuthActions session={session} twitterEnabled={twitterEnabled} />
          </div>
        </header>

        <section id="share" className="rb-bento">
          <AnalyzeForm canAnalyze={Boolean(session)} />

          <article className="rb-panel rb-panel-info">
            <h3>How It Works</h3>
            <ol>
              <li>Sign in with X.</li>
              <li>Paste an X post URL and share it.</li>
              <li>The exact post is embedded on the page and saved to your history.</li>
            </ol>
            <p className="rb-muted rb-tight">
              {twitterEnabled
                ? "Use History to revisit your saved posts later."
                : "Local auth is not configured yet. Add Twitter credentials and a database URL (AUTH_DATABASE_URL or DATABASE_URL)."}
            </p>
            <Link className="rb-btn rb-btn-ghost" href="/history">
              Open History
            </Link>
          </article>
        </section>
      </div>
    </main>
  );
}
