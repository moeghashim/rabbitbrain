"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

import { resolveInternalRedirectUrl } from "../../../src/auth/redirect-url.js";

function AuthPopupStartContent() {
	const searchParams = useSearchParams();
	const redirectUrl = resolveInternalRedirectUrl(searchParams.get("redirect_url"), "/app");
	const callbackUrl = `/auth/popup-complete?redirect_url=${encodeURIComponent(redirectUrl)}`;

	React.useEffect(() => {
		void signIn("twitter", { callbackUrl });
	}, [callbackUrl]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-ink px-6 text-center text-peach">
			<p className="text-sm text-peach/70">Connecting to Twitter...</p>
		</div>
	);
}

export default function AuthPopupStartPage() {
	return (
		<Suspense
			fallback={
				<main className="flex min-h-screen items-center justify-center bg-ink px-6 text-center text-peach">
					<p className="text-sm text-peach/70">Connecting to Twitter...</p>
				</main>
			}
		>
			<AuthPopupStartContent />
		</Suspense>
	);
}
