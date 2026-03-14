# Rabbitbrain Releases

Rabbitbrain uses Changesets and GitHub Releases for release automation.

## What gets released

- Public npm packages in `packages/*`
- The web app in `apps/web` via Vercel production deploy
- The Chrome extension zip from `apps/extension/dist`

Private apps are not published to npm.

## Contributor flow

1. Make the code change.
2. Run `npm run changeset`.
3. Pick the correct bump level for the affected package group.
4. Write a short summary that can appear in release notes.
5. Commit the generated `.changeset/*.md` file with your change.

## Maintainer flow

1. Merge changesets into `main`.
2. Wait for the `Release PR` workflow to open or update the `Version packages` PR.
3. Review the generated version bumps and changelog edits.
4. Merge the version PR.
5. Tag the merge commit as `vX.Y.Z` and push the tag:

```bash
git checkout main
git pull
git tag vX.Y.Z
git push origin vX.Y.Z
```

6. Let the `Release` workflow:
   - run `npm run check`
   - run `npm test`
   - run `npm run -w @pi-starter/web typecheck`
   - run `npm run -w @pi-starter/web build`
   - run `npm run extension:package`
   - run `npm run release:publish`
   - deploy the tagged commit to Vercel production
   - create the GitHub Release and attach the extension zip

## Required GitHub Secrets

- `NPM_TOKEN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Production runtime secrets stay in Vercel and are not duplicated into this workflow.

## Local release commands

- Create a changeset: `npm run changeset`
- Inspect release status: `npm run release:status`
- Apply pending version bumps locally: `npm run release:version`
- Publish unreleased public packages locally: `npm run release:publish`

Local publish and deploy are fallback workflows only. The standard path is through GitHub Actions.
