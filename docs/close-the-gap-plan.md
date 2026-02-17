# Rabbitbrain Close-the-Gap Plan

Last updated: 2026-02-17
Owner: Rabbitbrain engineering

## Goal

Raise Rabbitbrain from prototype-level quality to production-grade CLI quality, using `steipete/summarize` and `steipete/gogcli` as reference bars for:

- CI enforcement on every PR/push
- broader automated test coverage
- stronger static analysis and formatting discipline
- clearer modular boundaries in core CLI logic
- repeatable release and maintenance workflow

## Current Baseline

- Quality checks exist and currently pass locally:
  - `npm run test`
  - `npm run typecheck`
  - `npm run lint`
- Test suite is small (3 files / 9 tests) and mostly edge parsing coverage.
- There is no dedicated PR/push CI workflow; current workflow is focused on weekly vendor sync.
- Core analysis logic is concentrated in `lib/analysis/engine.mjs` (large single-file surface).

## Quality Targets (Definition of Done)

- CI blocks merges unless lint, typecheck, tests, and build all pass on PR.
- Add coverage reporting and enforce minimum thresholds for changed code.
- Increase automated tests to include CLI behavior, API failure handling, and integration seams.
- Break the core analysis engine into smaller modules with clear ownership and contracts.
- Add release/maintenance docs and a standard local `check` command matching CI.

## Phased Plan

## Phase 1: CI Gate and Local Quality Contract

Status: not started

Work:

- Add `.github/workflows/ci.yml` on `push` and `pull_request`.
- CI steps:
  - install dependencies (`npm ci`)
  - lint
  - typecheck
  - test
  - build
- Add `npm run check` script that runs the same quality gates in CI order.
- Keep `sync-x-research.yml`, but ensure it does not replace CI requirements.

Acceptance criteria:

- Any failing lint/type/test/build fails CI on PR.
- `npm run check` is documented and used as pre-PR command.

## Phase 2: Test Expansion and Coverage Guardrails

Status: not started

Work:

- Expand unit tests in:
  - `lib/analysis/*`
  - `lib/xresearch/*`
  - `cli/index.mjs` argument handling and error output
- Add integration-style tests around:
  - X API non-200 responses
  - malformed/unexpected API payloads
  - optional Convex persistence failure paths
- Enable coverage output in Vitest and add minimum thresholds (start moderate, then raise).

Acceptance criteria:

- Coverage report is generated in CI.
- Thresholds enforced in CI.
- Regression tests exist for each bug fixed in analysis/CLI behavior.

## Phase 3: Core Refactor for Maintainability

Status: not started

Work:

- Decompose `lib/analysis/engine.mjs` into focused modules (example split):
  - API client + retry/rate limit behavior
  - tweet parsing and normalization
  - ranking/scoring
  - topic extraction/classification
  - output shaping contract
- Keep public API stable while moving logic under internal modules.
- Add targeted tests per module as code moves.

Acceptance criteria:

- No single analysis module grows unbounded.
- Test coverage increases while refactoring (no net loss).
- CLI output contract remains backward-compatible.

## Phase 4: Linting and Formatting Hardening

Status: not started

Work:

- Migrate from `next lint` wrapper to direct ESLint CLI before Next 16 removal.
- Add stricter ESLint rules incrementally (promises, complexity, import hygiene, unsafe patterns).
- Add formatting command and check mode (`format` + `format:check`) and enforce in CI.
- Consider `lint:fix` for developer workflow speed.

Acceptance criteria:

- CI uses stable lint commands not tied to deprecated wrappers.
- Formatting and linting are deterministic and documented.

## Phase 5: Release and Operational Discipline

Status: not started

Work:

- Add `CHANGELOG.md` process (manual or automated).
- Add release checklist doc (`docs/releasing.md`) for CLI versioning and publish flow.
- Add smoke test command for post-release validation (CLI analyze/discover sanity checks).
- Document branch protection expectations (required checks).

Acceptance criteria:

- Release path is repeatable and documented.
- Required checks are explicit and enforced in GitHub settings.

## Tracking Template

Use this table when implementing each phase.

| Item | Owner | Status | PR | Notes |
|---|---|---|---|---|
| CI workflow (`ci.yml`) |  | not started |  |  |
| `npm run check` |  | not started |  |  |
| Coverage thresholds |  | not started |  |  |
| CLI tests expansion |  | not started |  |  |
| Engine modularization |  | not started |  |  |
| ESLint CLI migration |  | not started |  |  |
| Formatting check in CI |  | not started |  |  |
| Release docs/checklist |  | not started |  |  |

## Next Recommended Step

Start with Phase 1 in a single PR: add PR/push CI + `npm run check` + README quality command docs.
