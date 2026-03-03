export interface PopupAuthSuccessMessage {
	type: "twitter-auth-success";
	redirectUrl?: string;
}

interface StartTwitterPopupAuthOptions {
	callbackUrl: string;
	onSuccess: (redirectUrl: string) => void;
	onPopupBlocked?: () => void;
}

function isPopupAuthSuccessMessage(value: unknown): value is PopupAuthSuccessMessage {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	const record = value as Record<string, unknown>;
	return record.type === "twitter-auth-success";
}

export function startTwitterPopupAuth(options: StartTwitterPopupAuthOptions): () => void {
	const popupStartPath = `/auth/popup-start?redirect_url=${encodeURIComponent(options.callbackUrl)}`;
	const popup = window.open(
		popupStartPath,
		"rabbitbrain-twitter-auth",
		"popup=yes,width=540,height=760,menubar=no,toolbar=no,status=no,resizable=yes,scrollbars=yes",
	);

	if (!popup) {
		options.onPopupBlocked?.();
		return () => {};
	}

	popup.focus();

	let cleanedUp = false;
	let popupInterval: number | null = null;

	const messageHandler = (event: MessageEvent) => {
		if (event.origin !== window.location.origin) {
			return;
		}
		if (!isPopupAuthSuccessMessage(event.data)) {
			return;
		}

		cleanup();
		const nextPath =
			typeof event.data.redirectUrl === "string" && event.data.redirectUrl.startsWith("/")
				? event.data.redirectUrl
				: options.callbackUrl;
		options.onSuccess(nextPath);
	};

	const cleanup = () => {
		if (cleanedUp) {
			return;
		}
		cleanedUp = true;
		window.removeEventListener("message", messageHandler);
		if (popupInterval !== null) {
			window.clearInterval(popupInterval);
			popupInterval = null;
		}
	};

	window.addEventListener("message", messageHandler);
	popupInterval = window.setInterval(() => {
		if (!popup.closed) {
			return;
		}
		cleanup();
	}, 300);

	return cleanup;
}
