import { readXApiConfigFromEnv } from "@pi-starter/x-client";

type EnvMap = Record<string, string | undefined>;

export interface StartupEnv {
	authSecret: string;
	authXId: string;
	authXSecret: string;
	convexUrl: string;
	convexDeployment: string;
}

let hasValidated = false;

function readRequiredEnv(name: string, env: EnvMap): string {
	const value = env[name];
	if (!value || value.trim().length === 0) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value.trim();
}

export function validateStartupEnv(env: EnvMap = process.env): StartupEnv {
	readXApiConfigFromEnv(env as NodeJS.ProcessEnv);
	return {
		authSecret: readRequiredEnv("AUTH_SECRET", env),
		authXId: readRequiredEnv("AUTH_X_ID", env),
		authXSecret: readRequiredEnv("AUTH_X_SECRET", env),
		convexUrl: readRequiredEnv("NEXT_PUBLIC_CONVEX_URL", env),
		convexDeployment: readRequiredEnv("CONVEX_DEPLOYMENT", env),
	};
}

export function validateStartupEnvIfNeeded(env: EnvMap = process.env): void {
	if (env.NODE_ENV === "test" || env.SKIP_STARTUP_ENV_VALIDATION === "1") {
		return;
	}
	if (hasValidated) {
		return;
	}
	validateStartupEnv(env);
	hasValidated = true;
}
