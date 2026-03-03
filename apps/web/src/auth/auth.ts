import { type NextAuthOptions, getServerSession } from "next-auth";
import * as TwitterProviderModule from "next-auth/providers/twitter";
import type { TwitterProfile } from "next-auth/providers/twitter";

interface AuthEnv {
	AUTH_X_ID?: string;
	AUTH_X_SECRET?: string;
	AUTH_SECRET?: string;
}

interface TwitterProviderInit {
	clientId: string;
	clientSecret: string;
	version: "2.0";
	authorization?: {
		params?: {
			scope?: string;
		};
	};
}

type AuthProvider = NonNullable<NextAuthOptions["providers"]>[number];
type TwitterProviderFactory = (options: TwitterProviderInit) => AuthProvider;
const TWITTER_OAUTH_SCOPE = "users.read tweet.read";

interface ProviderAuthorization {
	url: string;
	params?: Record<string, string>;
}

function readRequiredEnv(name: keyof AuthEnv, env: AuthEnv, strictEnv: boolean): string {
	const value = env[name];
	if (value && value.trim().length > 0) {
		return value.trim();
	}
	if (!strictEnv) {
		return `__missing_${name.toLowerCase()}__`;
	}
	if (!value || value.trim().length === 0) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value.trim();
}

function resolveTwitterProviderFactory(): TwitterProviderFactory {
	const maybeDefault = TwitterProviderModule.default as unknown;
	if (typeof maybeDefault === "function") {
		return maybeDefault as TwitterProviderFactory;
	}

	if (typeof maybeDefault === "object" && maybeDefault !== null) {
		const nestedDefault = (maybeDefault as { default?: unknown }).default;
		if (typeof nestedDefault === "function") {
			return nestedDefault as TwitterProviderFactory;
		}
	}

	throw new Error("Unable to initialize next-auth twitter provider");
}

function enforceTwitterOauthScope(provider: AuthProvider): AuthProvider {
	if (!("authorization" in provider)) {
		return provider;
	}

	const providerWithAuthorization = provider as AuthProvider & { authorization?: unknown };
	const authorization = providerWithAuthorization.authorization;
	if (typeof authorization !== "object" || authorization === null || !("url" in authorization)) {
		return provider;
	}

	const typedAuthorization = authorization as ProviderAuthorization;
	providerWithAuthorization.authorization = {
		...typedAuthorization,
		params: {
			...(typedAuthorization.params ?? {}),
			scope: TWITTER_OAUTH_SCOPE,
		},
	};
	return provider;
}

export function buildAuthOptions(
	env: AuthEnv = process.env,
	options: { strictEnv?: boolean } = {},
): NextAuthOptions {
	const strictEnv = options.strictEnv ?? true;
	const twitterProvider = resolveTwitterProviderFactory();
	const provider = enforceTwitterOauthScope(
		twitterProvider({
			clientId: readRequiredEnv("AUTH_X_ID", env, strictEnv),
			clientSecret: readRequiredEnv("AUTH_X_SECRET", env, strictEnv),
			version: "2.0",
			authorization: {
				params: {
					scope: TWITTER_OAUTH_SCOPE,
				},
			},
		}),
	);

	return {
		secret: readRequiredEnv("AUTH_SECRET", env, strictEnv),
		session: {
			strategy: "jwt",
		},
		providers: [provider],
		pages: {
			signIn: "/sign-in",
		},
		callbacks: {
			async jwt({ token, profile }) {
				const twitterProfile = profile as TwitterProfile | undefined;
				const xUserId = twitterProfile?.data?.id;
				if (typeof xUserId === "string" && xUserId.length > 0) {
					token.sub = xUserId;
					token.xUserId = xUserId;
				}

				const username = twitterProfile?.data?.username;
				if (typeof username === "string" && username.length > 0) {
					token.xUsername = username;
				}

				const image = twitterProfile?.data?.profile_image_url;
				if (typeof image === "string" && image.length > 0) {
					token.picture = image;
				}

				return token;
			},
			async session({ session, token }) {
				if (session.user) {
					session.user.id = typeof token.xUserId === "string" ? token.xUserId : token.sub ?? "";
					session.user.xUsername = typeof token.xUsername === "string" ? token.xUsername : undefined;
				}
				return session;
			},
		},
	};
}

export async function getServerAuthSession() {
	return await getServerSession(buildAuthOptions(process.env));
}
