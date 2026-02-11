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
    <button className="secondary" onClick={signOut}>
      Sign out
    </button>
  ) : (
    <button onClick={signIn}>Sign in with X</button>
  );
}
