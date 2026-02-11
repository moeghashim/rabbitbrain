import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

const baseURL = process.env.BETTER_AUTH_URL ?? process.env.BETTER_AUTH_BASE_URL ?? "http://localhost:3000";
const secret = process.env.BETTER_AUTH_SECRET ?? "dev-only-change-me-to-a-strong-secret-32chars";
const twitterClientId = process.env.TWITTER_CLIENT_ID;
const twitterClientSecret = process.env.TWITTER_CLIENT_SECRET;
const socialProviders =
  twitterClientId && twitterClientSecret
    ? {
        twitter: {
          clientId: twitterClientId,
          clientSecret: twitterClientSecret
        }
      }
    : undefined;

const authDb = new Pool({
  connectionString: process.env.AUTH_DATABASE_URL
});

export const auth = betterAuth({
  database: authDb,
  baseURL,
  secret,
  socialProviders,
  plugins: [nextCookies()]
});
