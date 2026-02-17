# Rabbitbrain Release Checklist

Use this checklist for every CLI release.

## Preconditions

- You are on `main` with the latest remote changes.
- Required repository checks are green in GitHub.
- Required env vars are configured for validation (`X_BEARER_TOKEN`, optional Convex vars).

## 1) Local quality gate

Run:

```bash
npm run check
```

This must pass with no local modifications introduced by the quality tools.

## 2) Update changelog

- Add a new heading in `CHANGELOG.md` with date and version.
- Summarize user-visible changes and notable internal quality changes.

## 3) Version bump

Choose semver bump based on scope:

```bash
npm version patch
```

Use `minor` or `major` when applicable.

## 4) Push and verify CI

- Push the release commit and tag.
- Confirm CI checks pass:
  - format check
  - lint
  - typecheck
  - test coverage thresholds
  - build

## 5) Post-release smoke validation

Run CLI sanity checks against one known post and topic:

```bash
SMOKE_X_URL="https://x.com/<user>/status/<id>" npm run smoke:cli
```

Optional topic override:

```bash
SMOKE_X_URL="https://x.com/<user>/status/<id>" SMOKE_TOPIC="AI agents" npm run smoke:cli
```

## 6) Branch protection expectations

For `main`, require these checks before merge:

- `CI / quality`
- no force pushes
- at least one approval
- dismissal of stale approvals when new commits are pushed
