export interface ApiErrorPayload {
	error?: {
		code?: string;
		message?: string;
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function extractApiErrorPayload(payload: unknown): ApiErrorPayload | null {
	if (!isRecord(payload)) {
		return null;
	}
	const errorValue = payload.error;
	if (!isRecord(errorValue)) {
		return null;
	}

	const code = typeof errorValue.code === "string" ? errorValue.code : undefined;
	const message = typeof errorValue.message === "string" ? errorValue.message : undefined;
	return {
		error: {
			code,
			message,
		},
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
	payload: unknown,
	fallbackMessage: string,
): string {
	const message = extractApiErrorPayload(payload)?.error?.message?.trim();
	return message && message.length > 0 ? message : fallbackMessage;
}
