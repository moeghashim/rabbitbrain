# Auth Migration Baseline Snapshot (2026-03-03)

This file captures the pre-migration auth surface before switching from Clerk to X-only Auth.js.

## Current Auth Dependencies and Entrypoints

- `apps/web/package.json`: `@clerk/nextjs`
- `apps/web/middleware.ts`: `clerkMiddleware(...)` route protection
- `apps/web/app/layout.tsx`: `ClerkProvider`
- `apps/web/app/sign-in/[[...sign-in]]/page.tsx`: Clerk `SignIn`
- `apps/web/app/sign-up/[[...sign-up]]/page.tsx`: Clerk `SignUp`
- `apps/web/src/auth/routing.ts`: public/private path policy and sign-in redirect helper
- `apps/web/src/config/startup-env.ts`: requires Clerk env vars

## Current Convex Identity Surface

- `apps/web/convex/schema.ts`: `users.clerkUserId` + `by_clerk_user_id` index
- `apps/web/convex/users.ts`: upsert by `identity.subject` mapped to `clerkUserId`
- `apps/web/convex/preferences.ts`: user lookup by `by_clerk_user_id`
- `apps/web/convex/analysis.ts`: user lookup by `by_clerk_user_id`
- `apps/web/convex/tracks.ts`: user lookup by `by_clerk_user_id`
- `apps/web/src/data/preferences-service.ts`: in-memory `clerkUserId` mapping helper

## Current Tests Most Impacted by Auth Migration

- `apps/web/test/auth-routing.test.ts`
- `apps/web/test/startup-env.test.ts`
- `apps/web/test/preferences-service.test.ts`
- `apps/web/test/landing-page.test.tsx`
- `apps/web/test/account-ui.test.tsx`

## Cutover Defaults

- Auth strategy: Auth.js with X OAuth only
- No dual-run mode with Clerk
- No Clerk-to-X data migration
- Tweet ingestion remains app-only X keys
