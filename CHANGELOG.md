# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added

- CI workflow on `push` and `pull_request` with blocking quality gates.
- `npm run check` and coverage threshold enforcement with `npm run test:coverage`.
- Expanded automated tests for CLI behavior and X API failure/malformed payload handling.
- Release checklist in `docs/releasing.md`.
- CLI smoke-test command: `npm run smoke:cli`.

### Changed

- Migrated linting from `next lint` wrapper to direct ESLint CLI.
- Added formatting commands (`npm run format`, `npm run format:check`) and CI enforcement.
- Refactored `lib/analysis/engine.mjs` into focused internal modules while preserving public exports.
