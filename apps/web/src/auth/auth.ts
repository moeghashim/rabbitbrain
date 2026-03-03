import NextAuth, { type NextAuthOptions, getServerSession } from "next-auth";
import TwitterProvider, { type TwitterProfile } from "next-auth/providers/twitter";

function readRequiredEnv(name: "AUTH_X_ID" | "AUTH_X_SECRET" | "AUTH_SECRET"): string {
	const value = process.env[name];
	if (!value || value.trim().length === 0) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value.trim();
}

export const authOptions: NextAuthOptions = {
	secret: readRequiredEnv("AUTH_SECRET"),
	session: {
		strategy: "jwt",
	},
	providers: [
		TwitterProvider({
			clientId: readRequiredEnv("AUTH_X_ID"),
			clientSecret: readRequiredEnv("AUTH_X_SECRET"),
			version: "2.0",
		}),
	],
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

const authHandler = NextAuth(authOptions);

export const authRouteHandlers = {
	GET: authHandler,
	POST: authHandler,
};

export async function getServerAuthSession() {
	return await getServerSession(authOptions);
}
