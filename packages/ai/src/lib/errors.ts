export type AiProviderErrorCode =
	| "CONFIG_ERROR"
	| "UNAUTHORIZED"
	| "RATE_LIMITED"
	| "NETWORK_ERROR"
	| "UPSTREAM_ERROR"
	| "INVALID_RESPONSE";

export class AiProviderError extends Error {
	readonly code: AiProviderErrorCode;
	readonly provider: string;
	readonly retryable: boolean;
	readonly status?: number;

	constructor({
		message,
		code,
		provider,
		retryable = false,
		status,
	}: {
		message: string;
		code: AiProviderErrorCode;
		provider: string;
		retryable?: boolean;
		status?: number;
	}) {
		super(message);
		this.name = "AiProviderError";
		this.code = code;
		this.provider = provider;
		this.retryable = retryable;
		this.status = status;
	}
}
