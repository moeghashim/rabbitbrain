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
				className="rounded-[48px] border border-white/25 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
			>
				{isSigningOut ? "Signing Out..." : "Sign Out"}
			</button>
			{errorMessage ? <p className="text-xs text-peach/70">{errorMessage}</p> : null}
		</div>
	);
}
