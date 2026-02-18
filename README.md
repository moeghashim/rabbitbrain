# Rabbitbrain: CLI-First X Post Analyzer

Analyze an X post URL, enrich it with related context, and return machine-readable recommendations for integrator apps.

## Stack

- Next.js App Router + TypeScript
- better-auth (Twitter/X OAuth) + Postgres
- Convex for analysis persistence
- xAI for topic + summary classification
- Adapted `x-research-skill` API logic for X fetching

## Setup

1. Copy `.env.local.example` to `.env.local` and fill values.
2. Install dependencies: `npm install`
3. Run auth DB migration once: `npm run auth:migrate`
4. Start Convex in another terminal: `npx convex dev`
5. Start app: `npm run dev`

## CLI

Rabbitbrain is built as a CLI-first tool for service-to-service integration.

### Usage

```bash
npm run cli -- analyze --url "https://x.com/<user>/status/<id>" --pretty
```

or (after install/link):

```bash
rabbitbrain analyze --url "https://x.com/<user>/status/<id>" --pretty
```

Guided onboarding:

```bash
rabbitbrain init
rabbitbrain init --mode local
rabbitbrain init --mode convex
```

Local persistence (SQLite + Markdown, no Convex required):

```bash
rabbitbrain analyze --url "https://x.com/<user>/status/<id>" --storage local --pretty
```

Topic discovery:

```bash
rabbitbrain discover --topic "AI agents" --pretty
```

### Optional persistence

If you pass `--user-id`, the CLI also saves the enriched analysis to Convex:

```bash
rabbitbrain analyze --url "https://x.com/<user>/status/<id>" --user-id "user_123" --pretty
```

You can also choose storage explicitly:

```bash
rabbitbrain analyze --url "https://x.com/<user>/status/<id>" --storage convex --user-id "user_123" --pretty
rabbitbrain analyze --url "https://x.com/<user>/status/<id>" --storage local --user-id "local_user" --pretty
```

### CLI Onboarding Flow

Use `rabbitbrain init` to run a guided setup check. It validates required env vars for your selected mode and prints the exact first command to run.

- Default mode: `local`
- Supported modes: `local`, `convex`
- Exit code: `0` when setup is ready, `1` when required config is missing

### CLI output contract

The CLI returns one JSON object with:

- `analysis.appAbout`: one-sentence description of what the app/post is about
- `follow`: X links to follow the creator, explore the topic, and explore creator+topic
- `recommendations.similarPeople`: top 5 similar people to follow
- `recommendations.topicsToFollow`: top 5 topics covered by the post
- `recommendations.creator`: creator impact analysis and follow recommendation

### CLI environment

- `X_BEARER_TOKEN` is required.
- `CONVEX_URL` (or `NEXT_PUBLIC_CONVEX_URL`) is required for Convex persistence.
- `RABBITBRAIN_STORAGE` is optional default mode for onboarding and analyze behavior (`local` or `convex`).
- `RABBITBRAIN_USER_ID` is optional default user id for analyze persistence.
- `RABBITBRAIN_LOCAL_DB_PATH` is optional for local storage path (default: `.rabbitbrain/local-analyses.db`).
- `RABBITBRAIN_LOCAL_MD_DIR` is optional for local Markdown path (default: `.rabbitbrain/analyses-markdown`).

## Required Env Vars

- `X_BEARER_TOKEN`
- `XAI_API_KEY`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`
- `AUTH_DATABASE_URL`
- `CONVEX_URL` and `NEXT_PUBLIC_CONVEX_URL`
- `RABBITBRAIN_STORAGE` (optional)
- `RABBITBRAIN_USER_ID` (optional)
- `RABBITBRAIN_LOCAL_DB_PATH` (optional)
- `RABBITBRAIN_LOCAL_MD_DIR` (optional)

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
- Each sync PR runs `format:check`, `lint`, `typecheck`, and `test` before creation.
- If automated PR creation is blocked, enable repository setting `Allow GitHub Actions to create and approve pull requests`, or add `SYNC_PR_TOKEN` (PAT with `repo` scope) as a repository secret.
