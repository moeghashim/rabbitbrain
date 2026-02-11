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
    <main>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h1>Your Analysis History</h1>
        <Link href="/">Back</Link>
      </div>
      <HistoryList analyses={analyses} />
    </main>
  );
}
