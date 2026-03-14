#!/usr/bin/env node

console.error(
	[
		"Release automation now uses Changesets and GitHub Actions.",
		"Run `npm run changeset` to create release notes for your change.",
		"Merge the generated release PR, then tag the merge commit as `vX.Y.Z` and push the tag.",
		"See docs/releases.md for the full release runbook.",
	].join("\n"),
);
process.exit(1);
