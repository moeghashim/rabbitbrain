#!/usr/bin/env node

import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const bump = process.argv[2];
if (!["patch", "minor", "major"].includes(bump)) {
	console.error("Usage: node scripts/release.mjs <patch|minor|major>");
	process.exit(1);
}

function run(command) {
	execSync(command, { stdio: "inherit", encoding: "utf8" });
}

function ensureCleanGitTree() {
	const status = execSync("git status --porcelain", { encoding: "utf8" });
	if (status.trim()) {
		console.error("Release aborted: uncommitted changes detected.");
		process.exit(1);
	}
}

function changelogPaths() {
	return readdirSync("packages")
		.map((packageName) => join("packages", packageName, "CHANGELOG.md"))
		.filter((path) => existsSync(path));
}

function readVersion() {
	const corePackage = JSON.parse(readFileSync("packages/core/package.json", "utf8"));
	return corePackage.version;
}

function moveUnreleasedToVersion(version) {
	const date = new Date().toISOString().split("T")[0];
	for (const path of changelogPaths()) {
		const content = readFileSync(path, "utf8");
		if (!content.includes("## [Unreleased]")) {
			continue;
		}
		writeFileSync(path, content.replace("## [Unreleased]", `## [${version}] - ${date}`));
	}
}

function addUnreleasedSection() {
	for (const path of changelogPaths()) {
		const content = readFileSync(path, "utf8");
		if (content.includes("## [Unreleased]")) {
			continue;
		}

		writeFileSync(path, content.replace(/^(# Changelog\n\n)/, "$1## [Unreleased]\n\n"));
	}
}

ensureCleanGitTree();
run(`npm run version:${bump}`);

const version = readVersion();
moveUnreleasedToVersion(version);

run("git add .");
run(`git commit -m "Release v${version}"`);
run(`git tag v${version}`);

run("npm run build");
run("npm run check");
run("npm test");
run("npm publish -ws --access public");

addUnreleasedSection();
run("git add .");
run('git commit -m "Add [Unreleased] section for next cycle"');
run("git push origin main");
run(`git push origin v${version}`);
