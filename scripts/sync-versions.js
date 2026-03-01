#!/usr/bin/env node

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const packagesDir = join(process.cwd(), "packages");
const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => entry.name);

const packages = new Map();
const versionMap = new Map();

for (const dir of packageDirs) {
	const packagePath = join(packagesDir, dir, "package.json");
	const data = JSON.parse(readFileSync(packagePath, "utf8"));
	packages.set(dir, { packagePath, data });
	versionMap.set(data.name, data.version);
}

const allVersions = new Set(versionMap.values());
if (allVersions.size > 1) {
	console.error("ERROR: lockstep versioning is enabled but package versions differ.");
	process.exit(1);
}

for (const { packagePath, data } of packages.values()) {
	let updated = false;

	for (const dependencyField of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
		const deps = data[dependencyField];
		if (!deps) {
			continue;
		}

		for (const dependencyName of Object.keys(deps)) {
			const dependencyVersion = versionMap.get(dependencyName);
			if (!dependencyVersion) {
				continue;
			}

			const desiredRange = `^${dependencyVersion}`;
			if (deps[dependencyName] !== desiredRange) {
				deps[dependencyName] = desiredRange;
				updated = true;
			}
		}
	}

	if (updated) {
		writeFileSync(packagePath, `${JSON.stringify(data, null, "\t")}\n`);
	}
}
