import type { PendingAuthAction } from "../shared/messages.js";
import { PENDING_AUTH_ACTION_STORAGE_KEY } from "../shared/storage.js";

export async function readPendingAuthAction(): Promise<PendingAuthAction | null> {
	const stored = await chrome.storage.local.get(PENDING_AUTH_ACTION_STORAGE_KEY);
	const pendingAction = stored[PENDING_AUTH_ACTION_STORAGE_KEY];
	if (!pendingAction || typeof pendingAction !== "object") {
		return null;
	}
	return pendingAction as PendingAuthAction;
}

export async function writePendingAuthAction(pendingAction: PendingAuthAction): Promise<void> {
	await chrome.storage.local.set({
		[PENDING_AUTH_ACTION_STORAGE_KEY]: pendingAction,
	});
}

export async function clearPendingAuthAction(): Promise<void> {
	await chrome.storage.local.remove(PENDING_AUTH_ACTION_STORAGE_KEY);
}
