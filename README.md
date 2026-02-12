# Rabbitbrain: X Post Learning Topic Classifier

Paste an X post URL, enrich it with related posts, and classify it into a 1-2 word learning topic.

## Stack

- Next.js App Router + TypeScript
- better-auth (Twitter/X OAuth) + Postgres
- Convex for analysis persistence
- xAI for topic classification
- Adapted `x-research-skill` API logic for X fetching

## Setup

1. Copy `.env.local.example` to `.env.local` and fill values.
2. Install dependencies: `npm install`
3. Run auth DB migration once: `npm run auth:migrate`
4. Start Convex in another terminal: `npx convex dev`
5. Start app: `npm run dev`

## Required Env Vars

- `X_BEARER_TOKEN`
- `XAI_API_KEY`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`
- `AUTH_DATABASE_URL`
- `CONVEX_URL` and `NEXT_PUBLIC_CONVEX_URL`

## X OAuth Setup

- Callback URL (local): `http://localhost:3000/api/auth/callback/twitter`
- Callback URL (prod): `https://<your-vercel-domain>/api/auth/callback/twitter`
- Website URL: your deployed app URL (for local-only testing, use your Vercel URL here)

## Vercel + Neon

1. Attach Neon to Vercel (this creates `DATABASE_URL`/`POSTGRES_*` env vars).
2. Pull development env vars locally: `vercel env pull .env.local`
3. Ensure `BETTER_AUTH_URL`, `TWITTER_CLIENT_ID`, and `TWITTER_CLIENT_SECRET` are present.
4. Run `npm run auth:migrate` to create Better Auth tables in Neon.

## Skill Provenance

The app adapts X fetch/parsing logic from `rohunvora/x-research-skill` commit `c21149b272eb724d4f5a785a17a2f0312440c82b`, stored under `vendor/x-research-skill/`.

## SaaS Integration Model

- Production requests do **not** execute `SKILL.md` or `bun run x-search.ts`.
- The app calls an embedded provider (`lib/xresearch/provider.ts`) built from adapted upstream logic.
- This keeps runtime behavior deterministic for serverless/container deployment while preserving upstream provenance.

## Upstream Update Workflow

- Manual sync: `npm run sync:x-research`
- Automated sync: `.github/workflows/sync-x-research.yml` runs weekly and opens a PR.
- Each sync PR runs `typecheck`, `test`, and `lint` before creation.
