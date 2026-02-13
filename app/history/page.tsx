import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listUserAnalyses } from "@/lib/convex";
import { HistoryList } from "@/components/HistoryList";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/");
  }

  const analyses = await listUserAnalyses(session.user.id);

  return (
    <main className="rb-page">
      <div className="rb-shell rb-grid-pattern rb-history-shell">
        <div className="rb-glow rb-glow-lime" aria-hidden />

        <header className="rb-header rb-history-header">
          <div className="rb-brand-wrap">
            <div className="rb-brand-mark">R</div>
            <div>
              <div className="rb-brand-title">History</div>
              <div className="rb-brand-subtitle">Saved analyses</div>
            </div>
          </div>

          <div className="rb-header-actions">
            <Link className="rb-btn rb-btn-ghost" href="/">
              Back To Analyze
            </Link>
          </div>
        </header>

        <section className="rb-history-content">
          <HistoryList analyses={analyses} />
        </section>
      </div>
    </main>
  );
}
