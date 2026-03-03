import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

import { validateMiddlewareEnvIfNeeded } from "./src/config/startup-env.js";
import { resolveAuthRedirectPath } from "./src/auth/routing.js";

export default async function middleware(req: NextRequest) {
	validateMiddlewareEnvIfNeeded();
	const token = await getToken({
		req,
		secret: process.env.AUTH_SECRET,
	});
	const redirectPath = resolveAuthRedirectPath({
		pathname: req.nextUrl.pathname,
		search: req.nextUrl.search,
		isAuthenticated: Boolean(token),
	});

	if (!redirectPath) {
		return NextResponse.next();
	}

	return NextResponse.redirect(new URL(redirectPath, req.url));
}

export const config = {
	matcher: ["/((?!api|_next|.*\\..*).*)"],
};
