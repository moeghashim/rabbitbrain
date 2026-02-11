# Rule: Generating PRDs for Rabbitbrain Features

## Goal

Create clear, implementation-ready PRDs in markdown for this project (X post topic classification app). The audience is a junior engineer.

## Workflow

1. Receive a short feature prompt.
2. Ask only 3-5 essential clarifying questions.
3. Questions must be numbered and use A/B/C/D options.
4. Generate the PRD using the template below.
5. Save as `tasks/prd-[feature-name].md`.

## Mandatory Clarifying Question Areas

1. Problem/goal.
2. Target user.
3. Scope and non-goals.
4. Success criteria.
5. Quality gates (required).

## Required Quality Gates Section

Every PRD must include:

- `npm run typecheck`
- `npm run lint`
- `npm run test`

For UI stories, include a browser verification requirement for:

- Login flow
- Paste URL -> analyze flow
- Result rendering and history view

## PRD Template

```md
# PRD: [Feature Name]

## Introduction/Overview

## Goals

## Quality Gates

## User Stories
### US-001: [Title]
**Description:** As a [user], I want [feature] so that [benefit].

**Acceptance Criteria:**
- [ ] ...
- [ ] ...

## Functional Requirements
1. FR-1: ...
2. FR-2: ...

## Non-Goals (Out of Scope)

## Design Considerations (Optional)

## Technical Considerations (Optional)

## Success Metrics

## Open Questions
```

## App-Specific Starter Questions

1. Which enrichment mode should be used?
   A. Single post only
   B. Author + topic related posts (recommended)
   C. Full thread analysis
   D. User-configurable mode

2. How strict should topic formatting be?
   A. Exactly one word
   B. One or two words (recommended)
   C. Up to three words
   D. No strict limit

3. What auth policy is required?
   A. Public endpoint, no login
   B. Login required for all analysis (recommended)
   C. Login required only for history
   D. Internal/admin only

4. What retention policy should apply?
   A. Save all analyses (recommended)
   B. Session-only, no persistence
   C. User-opt-in save
   D. Save with TTL expiry

## Constraints

- Do not implement code while generating the PRD.
- Keep acceptance criteria explicit and verifiable.
- Avoid vague statements like “works correctly”.
