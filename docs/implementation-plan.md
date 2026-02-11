# Implementation Plan: X Post Learning Topic App

## Scope

- User signs in with X and pastes an X post URL.
- App fetches the target post and enriches context with related posts.
- App classifies content into a 1-2 word learning topic.
- App stores analyses per user in Convex.

## Core Decisions

- **Frontend/API:** Next.js App Router
- **App data:** Convex
- **Auth:** better-auth + Twitter provider
- **Auth storage:** Postgres
- **Classifier:** xAI chat completions
- **X fetcher:** adapted from `x-research-skill` API layer

## API Contract

### `POST /api/analyze`

Request body:

```json
{ "xUrl": "https://x.com/<user>/status/<id>" }
```

Success response:

```json
{
  "id": "<convex-id>",
  "topic": "Prompt Engineering",
  "confidence": 0.91,
  "primaryPost": { "id": "...", "text": "..." },
  "relatedPosts": [{ "id": "...", "text": "..." }],
  "createdAt": 1739290000000
}
```

Failure response shape:

```json
{ "error": "message", "code": "OPTIONAL_CODE" }
```

## Data Model (`analyses`)

- `userId: string`
- `xUrl: string`
- `tweetId: string`
- `authorUsername: string`
- `primaryText: string`
- `relatedTexts: string[]`
- `topic: string` (1-2 words)
- `confidence: number` (0-1)
- `model: string`
- `createdAt: number`

## Pipeline

1. Validate X/Twitter URL and extract tweet ID.
2. Get authenticated session.
3. Fetch primary post via adapted X API module.
4. Build enrichment set from author and topic-related searches.
5. Classify with xAI into JSON output.
6. Normalize/validate to 1-2 words.
7. Persist to Convex and return result.

## Security and Cost Controls

- Require auth session for analysis endpoint.
- Add per-user rate limiting on analyze route.
- Never expose API secrets to client.
- Restrict X fetch to read-only endpoints.

## Milestones

1. Scaffold app and environment.
2. Wire auth and session checks.
3. Add X post fetch + enrichment.
4. Add classification + normalization.
5. Persist and render history.
6. Add tests and docs.

## Acceptance

- Valid URL always yields a normalized 1-2 word topic.
- Invalid URLs return 400.
- Unauthorized calls return 401.
- History is scoped by user.
- Upstream X failures return controlled 5xx errors.
