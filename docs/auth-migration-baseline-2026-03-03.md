# Auth Migration Baseline Snapshot (2026-03-03)

This file captures the pre-migration auth surface before switching from a legacy auth provider to X-only Auth.js.

## Current Auth Dependencies and Entrypoints

- `apps/web/package.json`: legacy auth SDK dependency
- `apps/web/middleware.ts`: legacy auth middleware route protection
- `apps/web/app/layout.tsx`: legacy auth provider wrapper
- `apps/web/app/sign-in/[[...sign-in]]/page.tsx`: legacy auth sign-in component
- `apps/web/app/sign-up/[[...sign-up]]/page.tsx`: legacy auth sign-up component
- `apps/web/src/auth/routing.ts`: public/private path policy and sign-in redirect helper
- `apps/web/src/config/startup-env.ts`: required legacy auth env vars

## Current Convex Identity Surface

- `apps/web/convex/schema.ts`: legacy external user ID index
- `apps/web/convex/users.ts`: user upsert from auth identity subject
- `apps/web/convex/preferences.ts`: user lookup by legacy auth-linked index
- `apps/web/convex/analysis.ts`: user lookup by legacy auth-linked index
- `apps/web/convex/tracks.ts`: user lookup by legacy auth-linked index
- `apps/web/src/data/preferences-service.ts`: in-memory legacy identity mapping helper

## Current Tests Most Impacted by Auth Migration

- `apps/web/test/auth-routing.test.ts`
- `apps/web/test/startup-env.test.ts`
- `apps/web/test/preferences-service.test.ts`
- `apps/web/test/landing-page.test.tsx`
- `apps/web/test/account-ui.test.tsx`

## Cutover Defaults

- Auth strategy: Auth.js with X OAuth only
- No dual-run mode with the legacy auth provider
- No legacy-auth-to-X data migration
- Tweet ingestion remains app-only X keys
