"use client";

import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

import { resolveInternalRedirectUrl } from "../../../src/auth/redirect-url.js";

interface AuthSuccessMessage {
	type: "twitter-auth-success";
	redirectUrl: string;
}

function AuthPopupCompleteContent() {
	const searchParams = useSearchParams();
	const redirectUrl = resolveInternalRedirectUrl(searchParams.get("redirect_url"), "/app");

	React.useEffect(() => {
		const successMessage: AuthSuccessMessage = {
			type: "twitter-auth-success",
			redirectUrl,
		};

		if (window.opener && !window.opener.closed) {
			window.opener.postMessage(successMessage, window.location.origin);
			window.close();
			const fallbackTimer = window.setTimeout(() => {
				window.location.replace(redirectUrl);
			}, 400);
			return () => {
				window.clearTimeout(fallbackTimer);
			};
		}

		window.location.replace(redirectUrl);
		return;
	}, [redirectUrl]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-ink px-6 text-center text-peach">
			<p className="text-sm text-peach/70">Finishing sign in...</p>
		</div>
	);
}

export default function AuthPopupCompletePage() {
	return (
		<Suspense
			fallback={
				<main className="flex min-h-screen items-center justify-center bg-ink px-6 text-center text-peach">
					<p className="text-sm text-peach/70">Finishing sign in...</p>
				</main>
			}
		>
			<AuthPopupCompleteContent />
		</Suspense>
	);
}
