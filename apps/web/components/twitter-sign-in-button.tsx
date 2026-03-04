"use client";

import React from "react";
import { buildTwitterAuthStartPath, startTwitterPopupAuth } from "../src/auth/popup-client.js";

export function TwitterSignInButton({ callbackUrl }: Readonly<{ callbackUrl: string }>) {
	const [popupBlockedMessage, setPopupBlockedMessage] = React.useState<string | null>(null);
	const popupCleanupRef = React.useRef<(() => void) | null>(null);

	React.useEffect(() => {
		return () => {
			popupCleanupRef.current?.();
			popupCleanupRef.current = null;
		};
	}, []);

	const startTwitterPopup = React.useCallback(() => {
		popupCleanupRef.current?.();
		popupCleanupRef.current = null;
		setPopupBlockedMessage(null);
		const fullPageFallback = () => {
			window.location.assign(buildTwitterAuthStartPath(callbackUrl));
		};
		popupCleanupRef.current = startTwitterPopupAuth({
			callbackUrl,
			onSuccess: (redirectUrl) => {
				window.location.assign(redirectUrl);
			},
			onPopupBlocked: () => {
				setPopupBlockedMessage("Opening full-page sign-in...");
				fullPageFallback();
			},
			onPopupClosed: fullPageFallback,
			onPopupTimedOut: fullPageFallback,
		});
	}, [callbackUrl]);

	return (
		<div className="mt-8 flex flex-col items-center gap-3">
			<button
				id="twitter-sign-in-button"
				data-callback-url={callbackUrl}
				type="button"
				onClick={startTwitterPopup}
				className="inline-flex rounded-[48px] bg-coral px-8 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-coral-hover"
			>
				Continue with Twitter
			</button>
			{popupBlockedMessage ? <p className="text-xs text-peach/70">{popupBlockedMessage}</p> : null}
		</div>
	);
}
