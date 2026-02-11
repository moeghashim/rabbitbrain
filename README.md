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
3. Start Convex in another terminal: `npx convex dev`
4. Start app: `npm run dev`

## Required Env Vars

- `X_BEARER_TOKEN`
- `XAI_API_KEY`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`
- `AUTH_DATABASE_URL`
- `CONVEX_URL` and `NEXT_PUBLIC_CONVEX_URL`

## Skill Provenance

The app adapts X fetch/parsing logic from `rohunvora/x-research-skill` commit `c21149b272eb724d4f5a785a17a2f0312440c82b`, stored under `vendor/x-research-skill/`.
