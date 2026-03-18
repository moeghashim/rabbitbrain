import {
	CreateFollowInputSchema,
	DeleteFollowInputSchema,
} from "@pi-starter/contracts";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getServerAuthSession } from "../../../../src/auth/auth.js";
import { validateStartupEnvIfNeeded } from "../../../../src/config/startup-env.js";
import {
	createCreatorFollowForSession,
	createSubjectFollowForSession,
	deleteCreatorFollowForSession,
	deleteSubjectFollowForSession,
	listFollowsForSession,
} from "../../../../src/server/convex-admin.js";
import { reportServerError } from "../../../../src/telemetry/report-error.js";

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

interface FollowsRouteDependencies {
	validateStartupEnvIfNeeded: () => void;
	getServerAuthSession: () => Promise<SessionLike | null>;
	listFollowsForSession: typeof listFollowsForSession;
	createCreatorFollowForSession: typeof createCreatorFollowForSession;
	createSubjectFollowForSession: typeof createSubjectFollowForSession;
	deleteCreatorFollowForSession: typeof deleteCreatorFollowForSession;
	deleteSubjectFollowForSession: typeof deleteSubjectFollowForSession;
	reportServerError: typeof reportServerError;
}

const defaultDependencies: FollowsRouteDependencies = {
	validateStartupEnvIfNeeded,
	getServerAuthSession,
	listFollowsForSession,
	createCreatorFollowForSession,
	createSubjectFollowForSession,
	deleteCreatorFollowForSession,
	deleteSubjectFollowForSession,
	reportServerError,
};

function readSessionUser(session: SessionLike | null): AuthenticatedSessionUser | null {
	const user = session?.user;
	const id = user?.id?.trim() ?? "";
	if (!user || !id) {
		return null;
	}
	return {
		id,
		email: user.email,
		name: user.name,
	};
}

function unauthorizedResponse() {
	return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
}

function notFoundResponse(message: string) {
	return NextResponse.json({ error: { message } }, { status: 404 });
}

export async function handleFollowsGet(
	_request: Request,
	_context?: unknown,
	dependencies: FollowsRouteDependencies = defaultDependencies,
) {
	try {
		dependencies.validateStartupEnvIfNeeded();
		const sessionUser = readSessionUser(await dependencies.getServerAuthSession());
		if (!sessionUser) {
			return unauthorizedResponse();
		}

		const summary = await dependencies.listFollowsForSession({
			sessionUser,
		});
		return NextResponse.json(summary);
	} catch (error) {
		dependencies.reportServerError({
			scope: "api.follows.get_failure",
			error,
		});
		return NextResponse.json(
			{ error: { message: error instanceof Error ? error.message : "Unable to load follows." } },
			{ status: 500 },
		);
	}
}

export async function handleFollowsPost(
	req: Request,
	_context?: unknown,
	dependencies: FollowsRouteDependencies = defaultDependencies,
) {
	try {
		dependencies.validateStartupEnvIfNeeded();
		const sessionUser = readSessionUser(await dependencies.getServerAuthSession());
		if (!sessionUser) {
			return unauthorizedResponse();
		}

		const input = CreateFollowInputSchema.parse(await req.json());
		if (input.kind === "creator") {
			const created = await dependencies.createCreatorFollowForSession({
				sessionUser,
				input: {
					creatorUsername: input.creatorUsername,
					creatorName: input.creatorName,
					creatorAvatarUrl: input.creatorAvatarUrl,
					scope: input.scope,
					subjectTag: input.subjectTag,
				},
			});
			return NextResponse.json(created);
		}

		const created = await dependencies.createSubjectFollowForSession({
			sessionUser,
			input: {
				subjectTag: input.subjectTag,
			},
		});
		return NextResponse.json(created);
	} catch (error) {
		if (error instanceof ZodError) {
			dependencies.reportServerError({
				scope: "api.follows.invalid_input",
				error,
			});
			return NextResponse.json(
				{ error: { message: error.issues[0]?.message ?? "Invalid follow input." } },
				{ status: 400 },
			);
		}
		dependencies.reportServerError({
			scope: "api.follows.post_failure",
			error,
		});
		return NextResponse.json(
			{ error: { message: error instanceof Error ? error.message : "Unable to save follow." } },
			{ status: 500 },
		);
	}
}

export async function handleFollowsDelete(
	req: Request,
	_context?: unknown,
	dependencies: FollowsRouteDependencies = defaultDependencies,
) {
	try {
		dependencies.validateStartupEnvIfNeeded();
		const sessionUser = readSessionUser(await dependencies.getServerAuthSession());
		if (!sessionUser) {
			return unauthorizedResponse();
		}

		const input = DeleteFollowInputSchema.parse(await req.json());
		if (input.kind === "creator") {
			const deleted = await dependencies.deleteCreatorFollowForSession({
				sessionUser,
				followId: input.followId,
			});
			return NextResponse.json(deleted);
		}

		const deleted = await dependencies.deleteSubjectFollowForSession({
			sessionUser,
			followId: input.followId,
		});
		return NextResponse.json(deleted);
	} catch (error) {
		if (error instanceof ZodError) {
			dependencies.reportServerError({
				scope: "api.follows.invalid_delete_input",
				error,
			});
			return NextResponse.json(
				{ error: { message: error.issues[0]?.message ?? "Invalid follow delete input." } },
				{ status: 400 },
			);
		}
		if (error instanceof Error && error.message === "Follow not found") {
			return notFoundResponse(error.message);
		}
		dependencies.reportServerError({
			scope: "api.follows.delete_failure",
			error,
		});
		return NextResponse.json(
			{ error: { message: error instanceof Error ? error.message : "Unable to delete follow." } },
			{ status: 500 },
		);
	}
}

export const GET = handleFollowsGet;
export const POST = handleFollowsPost;
export const DELETE = handleFollowsDelete;
