export function resolveInternalRedirectUrl(
	rawValue: string | string[] | null | undefined,
	fallback = "/app",
): string {
	const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
	if (!value || value.trim().length === 0) {
		return fallback;
	}
	if (!value.startsWith("/")) {
		return fallback;
	}
	return value;
}
