export const TWITTER_AUTH_CSRF_PATH = "/api/auth/csrf";
export const TWITTER_AUTH_SIGNIN_PATH = "/api/auth/signin/twitter";

interface TwitterAuthCsrfPayload {
	csrfToken?: unknown;
}

export interface TwitterAuthFormField {
	name: "csrfToken" | "callbackUrl";
	value: string;
}

export interface TwitterAuthSubmission {
	action: string;
	method: "POST";
	fields: TwitterAuthFormField[];
}

function readCsrfToken(payload: unknown): string {
	if (typeof payload !== "object" || payload === null) {
		throw new Error("Unable to start Twitter sign in.");
	}

	const { csrfToken } = payload as TwitterAuthCsrfPayload;
	if (typeof csrfToken !== "string" || csrfToken.trim().length === 0) {
		throw new Error("Unable to start Twitter sign in.");
	}

	return csrfToken;
}

export function buildTwitterAuthSubmission(callbackUrl: string, csrfToken: string): TwitterAuthSubmission {
	return {
		action: TWITTER_AUTH_SIGNIN_PATH,
		method: "POST",
		fields: [
			{ name: "csrfToken", value: csrfToken },
			{ name: "callbackUrl", value: callbackUrl },
		],
	};
}

export async function fetchTwitterAuthCsrfToken(fetchImpl: typeof fetch = fetch): Promise<string> {
	const response = await fetchImpl(TWITTER_AUTH_CSRF_PATH, {
		cache: "no-store",
		credentials: "same-origin",
	});

	if (!response.ok) {
		throw new Error("Unable to start Twitter sign in.");
	}

	return readCsrfToken(await response.json());
}

export async function startTwitterAuth(
	callbackUrl: string,
	options: {
		documentRef?: Document;
		fetchImpl?: typeof fetch;
	} = {},
): Promise<void> {
	const csrfToken = await fetchTwitterAuthCsrfToken(options.fetchImpl ?? fetch);
	const submission = buildTwitterAuthSubmission(callbackUrl, csrfToken);
	const documentRef = options.documentRef ?? document;
	const form = documentRef.createElement("form");
	form.method = submission.method;
	form.action = submission.action;
	form.style.display = "none";

	for (const field of submission.fields) {
		const input = documentRef.createElement("input");
		input.type = "hidden";
		input.name = field.name;
		input.value = field.value;
		form.append(input);
	}

	documentRef.body.append(form);
	form.submit();
}
