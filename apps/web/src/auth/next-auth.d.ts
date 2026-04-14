import type { DefaultSession } from "next-auth";
import type { JWT as NextAuthJwt } from "next-auth/jwt";

declare module "next-auth" {
	interface Session {
		user: DefaultSession["user"] & {
			id: string;
			xUsername?: string;
		};
	}
}

declare module "next-auth/jwt" {
	interface JWT extends NextAuthJwt {
		xUserId?: string;
		xUsername?: string;
		xAccessToken?: string;
		xRefreshToken?: string;
		xAccessTokenExpiresAt?: number;
		xTokenType?: string;
		xScope?: string;
	}
}
