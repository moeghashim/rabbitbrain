"use client";

import { signOut } from "next-auth/react";
import React from "react";

export function SignOutButton() {
	const [isSigningOut, setIsSigningOut] = React.useState(false);
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

	const handleClick = async () => {
		if (isSigningOut) {
			return;
		}

		setIsSigningOut(true);
		setErrorMessage(null);

		try {
			await signOut({ callbackUrl: "/" });
		} catch {
			setIsSigningOut(false);
			setErrorMessage("Unable to sign out. Refresh and try again.");
		}
	};

	return (
		<div className="flex flex-col gap-2">
			<button
				id="sign-out-button"
				type="button"
				onClick={() => {
					void handleClick();
				}}
				disabled={isSigningOut}
				className="w-full border border-outline-variant/20 px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-secondary transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
			>
				{isSigningOut ? "Signing Out..." : "Sign Out"}
			</button>
			{errorMessage ? <p className="font-body text-xs text-secondary/70">{errorMessage}</p> : null}
		</div>
	);
}
