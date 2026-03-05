export function toPositiveNumber(value: unknown): number | undefined {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
		return undefined;
	}
	return value;
}

export function toTweetMediaType(value: unknown): "photo" | "video" | "animated_gif" | undefined {
	if (typeof value !== "string") {
		return undefined;
	}
	const candidate = value.trim();
	if (candidate === "photo" || candidate === "video" || candidate === "animated_gif") {
		return candidate;
	}
	return undefined;
}
