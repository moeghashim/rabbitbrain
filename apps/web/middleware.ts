import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { resolveAuthRedirectPath } from "./src/auth/routing.js";

export default clerkMiddleware(async (auth, req) => {
	const state = await auth();
	const redirectPath = resolveAuthRedirectPath({
		pathname: req.nextUrl.pathname,
		search: req.nextUrl.search,
		isAuthenticated: Boolean(state.userId),
	});

	if (!redirectPath) {
		return NextResponse.next();
	}

	return NextResponse.redirect(new URL(redirectPath, req.url));
});

export const config = {
	matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
