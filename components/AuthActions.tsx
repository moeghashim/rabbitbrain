"use client";

import { authClient } from "@/lib/auth-client";

type SessionLike = {
  user: {
    id: string;
  };
} | null;

export function AuthActions({ session }: { session: SessionLike }) {
  const signIn = async () => {
    await authClient.signIn.social({
      provider: "twitter"
    });
  };

  const signOut = async () => {
    await authClient.signOut();
    window.location.reload();
  };

  return session ? (
    <button type="button" className="rb-btn rb-btn-dark" onClick={signOut}>
      Sign Out
    </button>
  ) : (
    <button type="button" className="rb-btn rb-btn-primary" onClick={signIn}>
      Sign In With X
    </button>
  );
}
