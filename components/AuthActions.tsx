"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type SessionLike = {
  user: {
    id: string;
  };
} | null;

export function AuthActions({
  session,
  twitterEnabled
}: {
  session: SessionLike;
  twitterEnabled: boolean;
}) {
  const [authError, setAuthError] = useState<string | null>(null);

  const signIn = async () => {
    setAuthError(null);
    try {
      await authClient.signIn.social({
        provider: "twitter"
      });
    } catch {
      setAuthError("X OAuth is not configured. Set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET.");
    }
  };

  const signOut = async () => {
    await authClient.signOut();
    window.location.reload();
  };

  if (session) {
    return (
      <button type="button" className="rb-btn rb-btn-dark" onClick={signOut}>
        Sign Out
      </button>
    );
  }

  if (!twitterEnabled) {
    return (
      <div className="rb-auth-wrap">
        <button type="button" className="rb-btn rb-btn-dark" disabled>
          X OAuth Not Configured
        </button>
        <p className="rb-config-note">Set `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET`.</p>
      </div>
    );
  }

  return (
    <div className="rb-auth-wrap">
      <button type="button" className="rb-btn rb-btn-primary" onClick={signIn}>
        Sign In With X
      </button>
      {authError ? <p className="rb-config-note">{authError}</p> : null}
    </div>
  );
}
