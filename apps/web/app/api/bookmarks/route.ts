import {
	SaveBookmarkInputSchema,
} from "@pi-starter/contracts";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getServerAuthSession } from "../../../src/auth/auth.js";
import { validateStartupEnvIfNeeded } from "../../../src/config/startup-env.js";
import {
	listBookmarksForSession,
	saveBookmarkForSession,
} from "../../../src/server/convex-admin.js";
import { reportServerError } from "../../../src/telemetry/report-error.js";

interface SessionUserLike {
	id?: string | null;
	email?: string | null;
	name?: string | null;
}

interface SessionLike {
	user?: SessionUserLike | null;
}

interface AuthenticatedSessionUser {
	id: string;
	email?: string | null;
	name?: string | null;
}

interface BookmarksRouteDependencies {
	validateStartupEnvIfNeeded: () => void;
	getServerAuthSession: () => Promise<SessionLike | null>;
	saveBookmarkForSession: typeof saveBookmarkForSession;
	listBookmarksForSession: typeof listBookmarksForSession;
	reportServerError: typeof reportServerError;
}

const defaultDependencies: BookmarksRouteDependencies = {
	validateStartupEnvIfNeeded,
	getServerAuthSession,
	saveBookmarkForSession,
	listBookmarksForSession,
	reportServerError,
};

function readSessionUser(session: SessionLike | null): AuthenticatedSessionUser | null {
	const user = session?.user;
	const userId = user?.id?.trim() ?? "";
	if (user && userId.length > 0) {
		return {
			id: userId,
			email: user.email,
			name: user.name,
		};
	}
	return null;
}

function unauthorizedResponse() {
	return NextResponse.json(
		{
			error: {
				code: "AUTH_REQUIRED",
				message: "Sign in with Twitter to manage bookmarks.",
			},
		},
		{ status: 401 },
	);
}

export async function handleBookmarksPost(
	req: Request,
	dependencies: BookmarksRouteDependencies = defaultDependencies,
) {
	try {
		dependencies.validateStartupEnvIfNeeded();
		const sessionUser = readSessionUser(await dependencies.getServerAuthSession());
		if (!sessionUser?.id) {
			return unauthorizedResponse();
		}

		const input = SaveBookmarkInputSchema.parse(await req.json());
		const saved = await dependencies.saveBookmarkForSession({
			sessionUser,
			input,
		});

		return NextResponse.json(saved);
	} catch (error) {
		if (error instanceof ZodError) {
			dependencies.reportServerError({
				scope: "api.bookmarks.invalid_input",
				error,
			});
			return NextResponse.json(
				{
					error: {
						code: "INVALID_INPUT",
						message: error.issues[0]?.message ?? "Invalid bookmark input.",
					},
				},
				{ status: 400 },
			);
		}

		dependencies.reportServerError({
			scope: "api.bookmarks.post_failure",
			error,
		});
		return NextResponse.json(
			{
				error: {
					code: "BOOKMARKS_FAILED",
					message: error instanceof Error ? error.message : "Unexpected bookmark save failure.",
				},
			},
			{ status: 500 },
		);
	}
}

export async function handleBookmarksGet(dependencies: BookmarksRouteDependencies = defaultDependencies) {
	try {
		dependencies.validateStartupEnvIfNeeded();
		const sessionUser = readSessionUser(await dependencies.getServerAuthSession());
		if (!sessionUser?.id) {
			return unauthorizedResponse();
		}

		const bookmarks = await dependencies.listBookmarksForSession({
			sessionUser,
		});
		return NextResponse.json({ bookmarks });
	} catch (error) {
		dependencies.reportServerError({
			scope: "api.bookmarks.get_failure",
			error,
		});
		return NextResponse.json(
			{
				error: {
					code: "BOOKMARKS_FAILED",
					message: error instanceof Error ? error.message : "Unexpected bookmarks fetch failure.",
				},
			},
			{ status: 500 },
		);
	}
}

export async function POST(req: Request) {
	return handleBookmarksPost(req);
}

export async function GET() {
	return handleBookmarksGet();
}
