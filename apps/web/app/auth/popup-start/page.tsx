"use client";

import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

import { resolveInternalRedirectUrl } from "../../../src/auth/redirect-url.js";
import { startTwitterAuth } from "../../../src/auth/start-twitter-auth.js";

function AuthPopupStartContent() {
	const searchParams = useSearchParams();
	const redirectUrl = resolveInternalRedirectUrl(searchParams.get("redirect_url"), "/app");
	const callbackUrl = `/auth/popup-complete?redirect_url=${encodeURIComponent(redirectUrl)}`;
	const [statusMessage, setStatusMessage] = React.useState("Connecting to Twitter...");
	const hasStartedRef = React.useRef(false);

	React.useEffect(() => {
		if (hasStartedRef.current) {
			return;
		}
		hasStartedRef.current = true;

		void startTwitterAuth(callbackUrl).catch(() => {
			setStatusMessage("Unable to start Twitter sign in. Refresh and try again.");
		});
	}, [callbackUrl]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-ink px-6 text-center text-peach">
			<p className="text-sm text-peach/70">{statusMessage}</p>
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
