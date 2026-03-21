import { XProviderError, type XProviderErrorCode } from "./errors.js";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function toNonEmptyString(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function firstNonEmptyString(values: unknown[]): string | undefined {
	for (const value of values) {
		const text = toNonEmptyString(value);
		if (text) {
			return text;
		}
	}
	return undefined;
}

interface ProviderProblemDetails {
	message?: string;
	type?: string;
}

function readProviderProblemDetails(payload: unknown): ProviderProblemDetails {
	if (!isRecord(payload)) {
		return {};
	}

	const topLevelMessage = firstNonEmptyString([payload.detail, payload.message, payload.title, payload.error]);
	const topLevelType = toNonEmptyString(payload.type);
	const errors = Array.isArray(payload.errors) ? payload.errors : undefined;
	if (!errors || errors.length === 0) {
		return {
			message: topLevelMessage,
			type: topLevelType,
		};
	}

	const firstProblem = errors.find((entry) => isRecord(entry));
	if (!firstProblem) {
		return {
			message: topLevelMessage,
			type: topLevelType,
		};
	}

	return {
		message: firstNonEmptyString([firstProblem.detail, firstProblem.message, firstProblem.title, topLevelMessage]),
		type: toNonEmptyString(firstProblem.type) ?? topLevelType,
	};
}

function readProviderProblemDetailsFromText(bodyText: string): ProviderProblemDetails {
	const trimmed = bodyText.trim();
	if (trimmed.length === 0) {
		return {};
	}

	try {
		return readProviderProblemDetails(JSON.parse(trimmed));
	} catch {
		return {
			message: trimmed,
		};
	}
}

function mapProviderProblemTypeToCode(problemType?: string): XProviderErrorCode | undefined {
	if (!problemType) {
		return undefined;
	}
	const normalized = problemType.toLowerCase();
	if (normalized.includes("resource-not-found") || normalized.includes("not-found")) {
		return "NOT_FOUND";
	}
	if (normalized.includes("rate-limit") || normalized.includes("usage-capped")) {
		return "RATE_LIMITED";
	}
	if (normalized.includes("not-authorized") || normalized.includes("forbidden")) {
		return "FORBIDDEN";
	}
	if (normalized.includes("invalid-request") || normalized.includes("invalid-parameter")) {
		return "INVALID_INPUT";
	}
	return undefined;
}

function defaultErrorMessageForCode(code: XProviderErrorCode, status?: number): string {
	switch (code) {
		case "UNAUTHORIZED":
			return "X API authentication failed.";
		case "FORBIDDEN":
			return "X API access is forbidden for this resource.";
		case "NOT_FOUND":
			return "Tweet was not found.";
		case "RATE_LIMITED":
			return "X API rate limit exceeded.";
		case "INVALID_INPUT":
			return "X API rejected the request.";
		case "CONFIG_ERROR":
			return "X API provider is not configured.";
		case "NETWORK_ERROR":
			return "Network error while calling X API.";
		default:
			return status ? `X API request failed with status ${status}.` : "X API returned an unexpected response.";
	}
}

export function toXProviderError(status: number, bodyText: string): XProviderError {
	const problem = readProviderProblemDetailsFromText(bodyText);
	const inferredCode = mapProviderProblemTypeToCode(problem.type);
	const providerMessage = problem.message;

	if (status === 401) {
		return new XProviderError({
			code: "UNAUTHORIZED",
			message: providerMessage ?? defaultErrorMessageForCode("UNAUTHORIZED"),
			status,
			retryable: false,
		});
	}
	if (status === 403) {
		return new XProviderError({
			code: "FORBIDDEN",
			message: providerMessage ?? defaultErrorMessageForCode("FORBIDDEN"),
			status,
			retryable: false,
		});
	}
	if (status === 404) {
		return new XProviderError({
			code: "NOT_FOUND",
			message: providerMessage ?? defaultErrorMessageForCode("NOT_FOUND"),
			status,
			retryable: false,
		});
	}
	if (status === 429) {
		return new XProviderError({
			code: "RATE_LIMITED",
			message: providerMessage ?? defaultErrorMessageForCode("RATE_LIMITED"),
			status,
			retryable: true,
		});
	}

	if (status === 400 || status === 422) {
		const code = inferredCode ?? "INVALID_INPUT";
		return new XProviderError({
			code,
			message: providerMessage ?? defaultErrorMessageForCode(code, status),
			status,
			retryable: code === "RATE_LIMITED",
		});
	}

	if (inferredCode) {
		return new XProviderError({
			code: inferredCode,
			message: providerMessage ?? defaultErrorMessageForCode(inferredCode, status),
			status,
			retryable: inferredCode === "RATE_LIMITED" || status >= 500,
		});
	}

	return new XProviderError({
		code: "UPSTREAM_ERROR",
		message: providerMessage ?? defaultErrorMessageForCode("UPSTREAM_ERROR", status),
		status,
		retryable: status >= 500,
	});
}

export function toXProviderErrorFromPayload(responseBody: unknown, fallbackMessage: string): XProviderError {
	const problem = readProviderProblemDetails(responseBody);
	const code = mapProviderProblemTypeToCode(problem.type) ?? "UPSTREAM_ERROR";
	return new XProviderError({
		code,
		message: problem.message ?? fallbackMessage,
		retryable: code === "RATE_LIMITED",
	});
}
