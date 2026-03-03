export interface TelemetryMetadata {
	[key: string]: string | number | boolean | null;
}

export interface ServerErrorEvent {
	scope: string;
	error: unknown;
	metadata?: TelemetryMetadata;
}

function normalizeError(error: unknown): { message: string; name: string } {
	if (error instanceof Error) {
		return {
			message: error.message,
			name: error.name,
		};
	}
	return {
		message: String(error),
		name: "UnknownError",
	};
}

export function reportServerError(event: ServerErrorEvent): void {
	const normalized = normalizeError(event.error);
	console.error(
		JSON.stringify({
			level: "error",
			scope: event.scope,
			errorName: normalized.name,
			errorMessage: normalized.message,
			metadata: event.metadata ?? {},
		}),
	);
}
