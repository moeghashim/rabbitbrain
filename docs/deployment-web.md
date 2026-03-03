# Web Deployment Runbook (Vercel + Auth.js + Convex + X)

## Required Environment Variables

Set these in both Vercel Preview and Production:

- `AUTH_SECRET`
- `AUTH_X_ID`
- `AUTH_X_SECRET`
- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`
- `CONVEX_DEPLOY_KEY` (server-only; used for authenticated server-to-Convex writes)
- `X_API_KEY`
- `X_API_SECRET`
- `X_BEARER_TOKEN`

Optional runtime control:

- `SKIP_STARTUP_ENV_VALIDATION=1` (only for temporary local troubleshooting)

## Auth.js + X OAuth Configuration

1. Configure X app callback URLs for both preview and production:
   - `https://<preview-domain>/api/auth/callback/twitter`
   - `https://<production-domain>/api/auth/callback/twitter`
2. Use `/sign-in` as the application entry route for authentication.
3. Keep protected routes:
   - `/app`
   - `/account`

## Convex Configuration

1. Set `CONVEX_DEPLOYMENT` for the target environment.
2. Set `NEXT_PUBLIC_CONVEX_URL` matching the deployment.
3. Set `CONVEX_DEPLOY_KEY` for trusted server-side mutation access.
4. Sync environment variables in Convex dashboard for server functions using X API.

## X Production Keys (App-Only Ingestion)

1. Use app-only keys with read access for tweet ingestion:
   - `X_API_KEY`
   - `X_API_SECRET`
   - `X_BEARER_TOKEN`
2. Rotate keys on a regular cadence and immediately after incidents.
3. Never print key values in logs or telemetry payloads.

## Route Configuration

1. Public auth routes:
   - `/sign-in`
   - `/sign-up` (redirects to `/sign-in`)
2. Middleware-protected routes:
   - `/app`
   - `/account`

## Startup Validation

`apps/web/src/config/startup-env.ts` validates all required env keys.
Missing keys fail fast at runtime startup/middleware execution.

## Pre-Deploy Validation

1. Run `npm test`.
2. Run `npm run check`.
3. Run `npm run -w @pi-starter/web typecheck`.
4. Build preview: `npm run -w @pi-starter/web build`.
