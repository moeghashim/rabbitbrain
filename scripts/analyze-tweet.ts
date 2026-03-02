#!/usr/bin/env node

import { execFile } from "node:child_process";
import process from "node:process";
import readline from "node:readline/promises";
import { promisify } from "node:util";
import {
	buildFeynmanTrack,
	type ConceptRating,
	parseTweetLearningAnalysisText,
	prioritizeConcepts,
	renderAnalysisMarkdown,
	renderConceptAssessmentMarkdown,
	renderLearningTrackMarkdown,
	type TweetLearningAnalysis,
} from "../packages/core/src/index.js";
import { DEFAULT_OPENAI_MODEL, RECOMMENDED_MODELS, readOpenAIConfig } from "./lib/openai-config.mjs";

const execFileAsync = promisify(execFile);

interface CliArgs {
	tweetInput: string;
	model: string;
	chooseModel: boolean;
	learn: boolean;
}

function printUsage() {
	console.error(
		[
			"Usage:",
			"  npm run xurl:analyze -- <tweet_url_or_id> [--model MODEL] [--choose-model] [--learn]",
			"",
			"Environment:",
			"  OPENAI_API_KEY   Optional override",
			"  OPENAI_MODEL     Optional override",
			"",
			"Config fallback:",
			"  npm run xurl:analyze:auth",
			"",
			"Learning mode:",
			"  --learn requires an interactive terminal (TTY).",
		].join("\n"),
	);
}

function parseArgs(argv: string[]): CliArgs {
	let tweetInput = "";
	let model = "";
	let chooseModel = false;
	let learn = false;

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--model") {
			const next = argv[i + 1];
			if (!next) {
				throw new Error("Missing value for --model");
			}
			model = next;
			i += 1;
			continue;
		}
		if (arg === "--choose-model") {
			chooseModel = true;
			continue;
		}
		if (arg === "--learn") {
			learn = true;
			continue;
		}
		if (arg === "-h" || arg === "--help") {
			printUsage();
			process.exit(0);
		}
		if (!tweetInput) {
			tweetInput = arg;
			continue;
		}
		throw new Error(`Unexpected argument: ${arg}`);
	}

	if (!tweetInput) {
		throw new Error("Missing tweet URL or ID");
	}

	return { tweetInput, model, chooseModel, learn };
}

function ensureLearnModeIsInteractive(learn: boolean): void {
	if (!learn) {
		return;
	}
	if (!process.stdin.isTTY || !process.stdout.isTTY) {
		throw new Error("`--learn` requires an interactive terminal (TTY). Run this command directly in a terminal.");
	}
}

async function chooseModelInteractively(defaultModel: string): Promise<string> {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	try {
		console.log("\nSelect model for this analysis:");
		RECOMMENDED_MODELS.forEach((name, index) => {
			const marker = name === defaultModel ? " (default)" : "";
			console.log(`  ${index + 1}. ${name}${marker}`);
		});
		console.log(`  ${RECOMMENDED_MODELS.length + 1}. custom`);

		const answer = (
			await rl.question(`Choose [1-${RECOMMENDED_MODELS.length + 1}] (default: ${defaultModel}): `)
		).trim();
		if (!answer) {
			return defaultModel;
		}

		const selected = Number.parseInt(answer, 10);
		if (Number.isNaN(selected) || selected < 1 || selected > RECOMMENDED_MODELS.length + 1) {
			throw new Error(`Invalid model selection: ${answer}`);
		}

		if (selected <= RECOMMENDED_MODELS.length) {
			return RECOMMENDED_MODELS[selected - 1] ?? defaultModel;
		}

		const custom = (await rl.question("Enter custom model name: ")).trim();
		if (!custom) {
			throw new Error("Custom model cannot be empty");
		}
		return custom;
	} finally {
		rl.close();
	}
}

function pickPrimaryTweet(payload: unknown): unknown {
	if (typeof payload !== "object" || payload === null) {
		return null;
	}
	const maybeData = (payload as { data?: unknown }).data;
	if (Array.isArray(maybeData) && maybeData.length > 0) {
		return maybeData[0] ?? null;
	}
	if (typeof maybeData === "object" && maybeData !== null) {
		return maybeData;
	}
	return null;
}

function extractResponseText(responseJson: unknown): string {
	if (typeof responseJson !== "object" || responseJson === null) {
		return "";
	}

	const outputText = (responseJson as { output_text?: unknown }).output_text;
	if (typeof outputText === "string" && outputText.trim()) {
		return outputText.trim();
	}

	const chunks: string[] = [];
	const output = (responseJson as { output?: unknown }).output;
	if (!Array.isArray(output)) {
		return "";
	}

	for (const item of output) {
		if (typeof item !== "object" || item === null) {
			continue;
		}
		const content = (item as { content?: unknown }).content;
		if (!Array.isArray(content)) {
			continue;
		}
		for (const candidate of content) {
			if (typeof candidate !== "object" || candidate === null) {
				continue;
			}
			const type = (candidate as { type?: unknown }).type;
			const text = (candidate as { text?: unknown }).text;
			if (type === "output_text" && typeof text === "string") {
				chunks.push(text);
			}
		}
	}

	return chunks.join("\n").trim();
}

async function readTweetWithXurl(tweetInput: string): Promise<unknown> {
	try {
		const { stdout } = await execFileAsync("xurl", ["read", tweetInput], { maxBuffer: 10 * 1024 * 1024 });
		return JSON.parse(stdout) as unknown;
	} catch (error) {
		const err = error as { stderr?: unknown; stdout?: unknown };
		const stderr = typeof err.stderr === "string" ? err.stderr : "";
		const stdout = typeof err.stdout === "string" ? err.stdout : "";
		throw new Error(`Failed to read tweet with xurl.\n${stderr || stdout || String(error)}`.trim());
	}
}

function buildSystemPrompt(): string {
	return [
		"You are analyzing a post on X.",
		"Return only a valid JSON object with exactly these keys: topic, summary, intent, novelConcepts.",
		"novelConcepts must be an array with exactly 5 objects.",
		"Each concept object must have keys: name and whyItMattersInTweet.",
		"topic/summary/intent/name/whyItMattersInTweet must be non-empty strings.",
		"Do not include markdown fences, comments, or extra keys.",
		"Keep it factual and avoid speculation when evidence is missing.",
	].join(" ");
}

async function analyzeWithOpenAI({
	apiKey,
	model,
	tweetPayload,
}: {
	apiKey: string;
	model: string;
	tweetPayload: unknown;
}): Promise<TweetLearningAnalysis> {
	const payloadObject = typeof tweetPayload === "object" && tweetPayload !== null ? tweetPayload : {};
	const payloadIncludes = (payloadObject as { includes?: unknown }).includes;
	const includesObject = typeof payloadIncludes === "object" && payloadIncludes !== null ? payloadIncludes : {};
	const primaryTweet = pickPrimaryTweet(tweetPayload);
	if (!primaryTweet) {
		throw new Error("xurl did not return a tweet payload.");
	}

	const compactPayload = {
		primary_tweet: primaryTweet,
		includes: {
			users: Array.isArray((includesObject as { users?: unknown[] }).users)
				? (includesObject as { users: unknown[] }).users
				: [],
			tweets: Array.isArray((includesObject as { tweets?: unknown[] }).tweets)
				? (includesObject as { tweets: unknown[] }).tweets
				: [],
			media: Array.isArray((includesObject as { media?: unknown[] }).media)
				? (includesObject as { media: unknown[] }).media
				: [],
		},
	};

	const userPrompt = ["Analyze this tweet payload:", JSON.stringify(compactPayload, null, 2)].join("\n\n");

	const response = await fetch("https://api.openai.com/v1/responses", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model,
			input: [
				{
					role: "system",
					content: [{ type: "input_text", text: buildSystemPrompt() }],
				},
				{
					role: "user",
					content: [{ type: "input_text", text: userPrompt }],
				},
			],
		}),
	});

	const responseJson = (await response.json()) as unknown;
	if (!response.ok) {
		throw new Error(`OpenAI API error (${response.status}): ${JSON.stringify(responseJson)}`);
	}

	const analysisText = extractResponseText(responseJson);
	if (!analysisText) {
		throw new Error("OpenAI API returned no text output.");
	}

	return parseTweetLearningAnalysisText(analysisText);
}

async function readRating(rl: readline.Interface, prompt: string, fieldLabel: string): Promise<1 | 2 | 3 | 4 | 5> {
	for (;;) {
		const raw = (await rl.question(prompt)).trim();
		const parsed = Number.parseInt(raw, 10);
		if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 5) {
			return parsed as 1 | 2 | 3 | 4 | 5;
		}
		console.log(`Invalid ${fieldLabel}. Enter an integer between 1 and 5.`);
	}
}

async function collectConceptRatings(analysis: TweetLearningAnalysis): Promise<ConceptRating[]> {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	try {
		console.log("\nRate each concept to personalize your 7-day Feynman track.");
		console.log("Familiarity: 1 = never heard, 5 = can teach clearly.");
		console.log("Interest: 1 = low priority, 5 = high priority.");

		const ratings: ConceptRating[] = [];
		for (let i = 0; i < analysis.novelConcepts.length; i += 1) {
			const concept = analysis.novelConcepts[i];
			if (!concept) {
				continue;
			}
			console.log(`\nConcept ${i + 1}/5: ${concept.name}`);
			console.log(`Why it matters: ${concept.whyItMattersInTweet}`);
			const familiarity = await readRating(rl, "  Familiarity (1-5): ", "familiarity");
			const interest = await readRating(rl, "  Interest (1-5): ", "interest");
			ratings.push({ concept, familiarity, interest });
		}
		return ratings;
	} finally {
		rl.close();
	}
}

async function main() {
	const { tweetInput, model: modelArg, chooseModel, learn } = parseArgs(process.argv.slice(2));
	ensureLearnModeIsInteractive(learn);

	const config = await readOpenAIConfig();
	const apiKey = process.env.OPENAI_API_KEY || config.apiKey;
	if (!apiKey) {
		throw new Error("OpenAI API key not found. Run `npm run xurl:analyze:auth` first.");
	}

	let model = modelArg || process.env.OPENAI_MODEL || config.defaultModel || DEFAULT_OPENAI_MODEL;
	if (chooseModel) {
		model = await chooseModelInteractively(model);
	}

	const tweetPayload = await readTweetWithXurl(tweetInput);
	const analysis = await analyzeWithOpenAI({ apiKey, model, tweetPayload });

	console.log(`# Analysis (${model})`);
	console.log("");
	console.log(renderAnalysisMarkdown(analysis));

	if (!learn) {
		return;
	}

	const ratings = await collectConceptRatings(analysis);
	const prioritized = prioritizeConcepts(ratings);
	const track = buildFeynmanTrack(prioritized);

	console.log("");
	console.log(renderConceptAssessmentMarkdown(prioritized));
	console.log("");
	console.log(renderLearningTrackMarkdown(track));
}

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`Error: ${message}`);
	printUsage();
	process.exit(1);
});
