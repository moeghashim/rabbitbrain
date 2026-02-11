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

  return (
    <main>
      <h1>Rabbitbrain</h1>
      <p className="muted">
        Share an X post URL, enrich it with related context, and classify it into a 1-2 word
        learning topic.
      </p>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <AuthActions session={session} />
        {session ? (
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Signed in as <strong>{session.user.email ?? session.user.name ?? session.user.id}</strong>.
            See your <Link href="/history">history</Link>.
          </p>
        ) : (
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Sign in with X to run analysis and save history.
          </p>
        )}
      </div>

      <AnalyzeForm canAnalyze={Boolean(session)} />
    </main>
  );
}
