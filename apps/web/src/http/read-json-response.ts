export interface ApiErrorPayload {
	error?: {
		code?: string;
		message?: string;
	};
}

export async function readJsonResponse<T>(response: Response): Promise<T | null> {
	const text = await response.text();
	if (text.trim().length === 0) {
		return null;
	}

	try {
		return JSON.parse(text) as T;
	} catch {
		return null;
	}
}

export function readResponseErrorMessage(
	payload: ApiErrorPayload | null | undefined,
	fallbackMessage: string,
): string {
	const message = payload?.error?.message?.trim();
	return message && message.length > 0 ? message : fallbackMessage;
}
