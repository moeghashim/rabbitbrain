#!/usr/bin/env node

import { execFile } from "node:child_process";
import process from "node:process";
import readline from "node:readline/promises";
import { promisify } from "node:util";
import { DEFAULT_OPENAI_MODEL, RECOMMENDED_MODELS, readOpenAIConfig } from "./lib/openai-config.mjs";

const execFileAsync = promisify(execFile);

function printUsage() {
	console.error(
		[
			"Usage:",
			"  npm run xurl:analyze -- <tweet_url_or_id> [--model MODEL] [--choose-model]",
			"",
			"Environment:",
			"  OPENAI_API_KEY   Optional override",
			"  OPENAI_MODEL     Optional override",
			"",
			"Config fallback:",
			"  npm run xurl:analyze:auth",
		].join("\n"),
	);
}

function parseArgs(argv) {
	let tweetInput = "";
	let model = "";
	let chooseModel = false;

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

	return { tweetInput, model, chooseModel };
}

async function chooseModelInteractively(defaultModel) {
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
			return RECOMMENDED_MODELS[selected - 1];
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

function pickPrimaryTweet(payload) {
	if (Array.isArray(payload?.data) && payload.data.length > 0) {
		return payload.data[0];
	}
	if (payload?.data && typeof payload.data === "object") {
		return payload.data;
	}
	return null;
}

function extractResponseText(responseJson) {
	if (typeof responseJson?.output_text === "string" && responseJson.output_text.trim()) {
		return responseJson.output_text.trim();
	}

	const chunks = [];
	const output = Array.isArray(responseJson?.output) ? responseJson.output : [];
	for (const item of output) {
		const content = Array.isArray(item?.content) ? item.content : [];
		for (const c of content) {
			if (c?.type === "output_text" && typeof c?.text === "string") {
				chunks.push(c.text);
			}
		}
	}

	return chunks.join("\n").trim();
}

async function readTweetWithXurl(tweetInput) {
	try {
		const { stdout } = await execFileAsync("xurl", ["read", tweetInput], { maxBuffer: 10 * 1024 * 1024 });
		return JSON.parse(stdout);
	} catch (error) {
		const stderr = error?.stderr ? String(error.stderr) : "";
		const stdout = error?.stdout ? String(error.stdout) : "";
		throw new Error(`Failed to read tweet with xurl.\n${stderr || stdout || String(error)}`.trim());
	}
}

async function analyzeWithOpenAI({ apiKey, model, tweetPayload }) {
	const primaryTweet = pickPrimaryTweet(tweetPayload);
	if (!primaryTweet) {
		throw new Error("xurl did not return a tweet payload.");
	}

	const compactPayload = {
		primary_tweet: primaryTweet,
		includes: {
			users: tweetPayload?.includes?.users || [],
			tweets: tweetPayload?.includes?.tweets || [],
			media: tweetPayload?.includes?.media || [],
		},
	};

	const systemPrompt = [
		"You are analyzing a post on X.",
		"Return concise markdown with exactly these sections:",
		"1) Topic",
		'For Topic, label the main domain (for example: "AI Optimization", "AI Guardrail", "Prompt Engineering").',
		"Choose the single best topic to help the user follow the subject area.",
		"2) Summary",
		"3) Intent",
		"Keep it factual and avoid speculation when evidence is missing.",
	].join(" ");

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
					content: [{ type: "input_text", text: systemPrompt }],
				},
				{
					role: "user",
					content: [{ type: "input_text", text: userPrompt }],
				},
			],
		}),
	});

	const responseJson = await response.json();
	if (!response.ok) {
		throw new Error(`OpenAI API error (${response.status}): ${JSON.stringify(responseJson)}`);
	}

	const analysis = extractResponseText(responseJson);
	if (!analysis) {
		throw new Error("OpenAI API returned no text output.");
	}
	return analysis;
}

async function main() {
	const { tweetInput, model: modelArg, chooseModel } = parseArgs(process.argv.slice(2));
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
	console.log(analysis);
}

main().catch((error) => {
	console.error(`Error: ${error.message || String(error)}`);
	printUsage();
	process.exit(1);
});
