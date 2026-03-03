export interface AuthRoutingInput {
	pathname: string;
	search?: string;
	isAuthenticated: boolean;
}

export const PUBLIC_PATH_PREFIXES = ["/", "/sign-in", "/sign-up", "/auth/popup-start", "/auth/popup-complete"] as const;

function normalizePath(pathname: string): string {
	if (!pathname.startsWith("/")) {
		return `/${pathname}`;
	}
	return pathname;
}

export function isPublicPath(pathname: string): boolean {
	const normalized = normalizePath(pathname);
	if (normalized === "/") {
		return true;
	}
	return PUBLIC_PATH_PREFIXES.filter((prefix) => prefix !== "/").some((prefix) => normalized.startsWith(prefix));
}

export function buildSignInRedirectPath(pathname: string, search = ""): string {
	const normalizedPathname = normalizePath(pathname);
	const redirectUrl = `${normalizedPathname}${search}`;
	const params = new URLSearchParams({ redirect_url: redirectUrl });
	return `/sign-in?${params.toString()}`;
}

export function resolveAuthRedirectPath(input: AuthRoutingInput): string | null {
	if (isPublicPath(input.pathname)) {
		return null;
	}
	if (input.isAuthenticated) {
		return null;
	}
	return buildSignInRedirectPath(input.pathname, input.search ?? "");
}
