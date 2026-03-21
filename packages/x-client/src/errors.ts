export type XProviderErrorCode =
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "NOT_FOUND"
	| "RATE_LIMITED"
	| "UPSTREAM_ERROR"
	| "INVALID_INPUT"
	| "CONFIG_ERROR"
	| "NETWORK_ERROR";

export class XProviderError extends Error {
	readonly code: XProviderErrorCode;
	readonly status?: number;
	readonly retryable: boolean;

	constructor({
		code,
		message,
		status,
		retryable,
	}: { code: XProviderErrorCode; message: string; status?: number; retryable: boolean }) {
		super(message);
		this.name = "XProviderError";
		this.code = code;
		this.status = status;
		this.retryable = retryable;
	}
}
