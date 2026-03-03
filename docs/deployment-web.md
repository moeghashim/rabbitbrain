# Web Deployment Runbook (Vercel + Clerk + Convex + X)

## Required Environment Variables

Set these in both Vercel Preview and Production:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`
- `X_API_KEY`
- `X_API_SECRET`
- `X_BEARER_TOKEN`

Optional runtime control:

- `SKIP_STARTUP_ENV_VALIDATION=1` (only for temporary local troubleshooting)

## Clerk Configuration

1. Configure sign-in and sign-up URLs:
   - `/sign-in`
   - `/sign-up`
2. Add Vercel Preview and Production domains to allowed redirect URLs.
3. Confirm middleware-protected routes:
   - `/app`
   - `/account`

## Convex Configuration

1. Set `CONVEX_DEPLOYMENT` for the target environment.
2. Set `NEXT_PUBLIC_CONVEX_URL` matching the deployment.
3. Sync environment variables in Convex dashboard for server functions using X API.

## X Production Keys

1. Use app-only keys with read access:
   - `X_API_KEY`
   - `X_API_SECRET`
   - `X_BEARER_TOKEN`
2. Rotate keys on a regular cadence and immediately after incidents.
3. Never print key values in logs or telemetry payloads.

## Startup Validation

`apps/web/src/config/startup-env.ts` validates all required env keys.
Missing keys fail fast at runtime startup/middleware execution.

## Pre-Deploy Validation

1. Run `npm test`.
2. Run `npm run check`.
3. Run `npm run -w @pi-starter/web typecheck`.
4. Build preview: `npm run -w @pi-starter/web build`.
