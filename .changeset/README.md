# Changesets

Rabbitbrain uses Changesets to prepare release PRs for the repo.

## Contributor flow

1. Make your code change.
2. Run `npm run changeset`.
3. Write a short summary for release notes.
4. Commit the generated markdown file in this folder with your work.

## Maintainer flow

1. Merge changesets into `main`.
2. Let the `Release PR` workflow open or update the version PR.
3. Merge the version PR.
4. Tag the merge commit as `vX.Y.Z` and push the tag.
5. Let the `Release` workflow publish packages, deploy the web app, and attach the extension zip to the GitHub Release.

See `docs/releases.md` for the full release runbook.
