import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../..");

function runAnalyze(args: string[]) {
	return spawnSync("npm", ["run", "xurl:analyze", "--", ...args], {
		cwd: repoRoot,
		encoding: "utf8",
		stdio: "pipe",
	});
}

test("xurl:analyze --help includes --learn", () => {
	const result = runAnalyze(["--help"]);
	const output = `${result.stdout}\n${result.stderr}`;
	assert.equal(result.status, 0);
	assert.match(output, /--learn/);
	assert.match(output, /--choose-model/);
});

test("xurl:analyze --learn fails in non-interactive mode", () => {
	const result = runAnalyze(["https://x.com/user/status/123", "--learn"]);
	const output = `${result.stdout}\n${result.stderr}`;
	assert.equal(result.status, 1);
	assert.match(output, /interactive terminal/i);
});
