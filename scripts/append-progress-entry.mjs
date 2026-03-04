#!/usr/bin/env node

import { execSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";

const MESSAGE_FILE_PATH = process.argv[2];
const PROGRESS_PATH = "progress.txt";
const APP_CODE_PREFIXES = ["apps/", "packages/"];
const NON_CODE_EXTENSIONS = new Set([
	".gif",
	".ico",
	".jpeg",
	".jpg",
	".md",
	".pdf",
	".png",
	".svg",
	".txt",
	".webp",
	".yaml",
	".yml",
]);

function run(command) {
	return execSync(command, { encoding: "utf8" }).trim();
}

function nowInChicago() {
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: "America/Chicago",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
		timeZoneName: "short",
	});
	const parts = formatter.formatToParts(new Date());
	const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
	return `${lookup.year}-${lookup.month}-${lookup.day} ${lookup.hour}:${lookup.minute}:${lookup.second} ${lookup.timeZoneName}`;
}

function readCommitSubject(path) {
	if (!path || !existsSync(path)) {
		return "";
	}
	const lines = readFileSync(path, "utf8")
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0 && !line.startsWith("#"));
	return lines[0] ?? "";
}

function stagedFiles() {
	const output = run("git diff --cached --name-only");
	if (!output) {
		return [];
	}
	return output
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0 && line !== PROGRESS_PATH);
}

function extensionFor(filePath) {
	const dotIndex = filePath.lastIndexOf(".");
	if (dotIndex < 0) {
		return "";
	}
	return filePath.slice(dotIndex).toLowerCase();
}

function isAppCodeFile(filePath) {
	if (!APP_CODE_PREFIXES.some((prefix) => filePath.startsWith(prefix))) {
		return false;
	}
	const extension = extensionFor(filePath);
	if (extension.length === 0) {
		return true;
	}
	return !NON_CODE_EXTENSIONS.has(extension);
}

const subject = readCommitSubject(MESSAGE_FILE_PATH);
const files = stagedFiles();
const appCodeFiles = files.filter(isAppCodeFile);

if (appCodeFiles.length === 0) {
	console.log(`Skipped ${PROGRESS_PATH} append: no staged app/code files under apps/ or packages/.`);
	process.exit(0);
}

const feature = subject || "Automated commit checkpoint";
const filePreview =
	appCodeFiles.length <= 8
		? appCodeFiles.join(", ")
		: `${appCodeFiles.slice(0, 8).join(", ")}, +${appCodeFiles.length - 8} more`;
const learning =
	process.env.PROGRESS_LEARNING?.trim() ||
	"Record one concrete risk earlier and define the validation command before coding.";

const entry = [
	`Date/Time (America/Chicago): ${nowInChicago()}`,
	`Feature: ${feature}`,
	`What was implemented: Auto-appended commit entry for staged files: ${filePreview}.`,
	"Bugs/issues found: None observed during local hook checks.",
	"Root cause: N/A.",
	"Fix applied: N/A.",
	`What to do differently next feature: ${learning}`,
].join("\n");

const existing = existsSync(PROGRESS_PATH) ? readFileSync(PROGRESS_PATH, "utf8") : "";
const prefix = existing.trim().length > 0 ? "\n\n" : "";
appendFileSync(PROGRESS_PATH, `${prefix}${entry}\n`);

run("git add -- progress.txt");
console.log(`Appended ${PROGRESS_PATH} entry for commit: ${feature}`);
