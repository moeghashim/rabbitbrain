#!/usr/bin/env node

import process from "node:process";
import readline from "node:readline/promises";
import {
	DEFAULT_OPENAI_MODEL,
	OPENAI_CONFIG_PATH,
	RECOMMENDED_MODELS,
	readOpenAIConfig,
	writeOpenAIConfig,
} from "./lib/openai-config.mjs";

function printUsage() {
	console.log(
		[
			"Usage:",
			"  npm run xurl:analyze:auth",
			"  npm run xurl:analyze:auth -- --api-key <KEY> --model <MODEL> --yes",
			"",
			"Options:",
			"  --api-key <KEY>   Set API key non-interactively",
			"  --model <MODEL>   Set default model",
			"  --yes             Skip interactive prompts where possible",
			"  -h, --help        Show help",
		].join("\n"),
	);
}

function parseArgs(argv) {
	let apiKey = "";
	let model = "";
	let yes = false;

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--api-key") {
			const value = argv[i + 1];
			if (!value) {
				throw new Error("Missing value for --api-key");
			}
			apiKey = value.trim();
			i += 1;
			continue;
		}
		if (arg === "--model") {
			const value = argv[i + 1];
			if (!value) {
				throw new Error("Missing value for --model");
			}
			model = value.trim();
			i += 1;
			continue;
		}
		if (arg === "--yes") {
			yes = true;
			continue;
		}
		if (arg === "-h" || arg === "--help") {
			printUsage();
			process.exit(0);
		}
		throw new Error(`Unexpected argument: ${arg}`);
	}

	return { apiKey, model, yes };
}

function isLikelyApiKey(value) {
	return value.startsWith("sk-");
}

async function chooseModel(rl, currentModel) {
	console.log("\nSelect default model:");
	RECOMMENDED_MODELS.forEach((name, index) => {
		const marker = name === currentModel ? " (current)" : "";
		console.log(`  ${index + 1}. ${name}${marker}`);
	});
	console.log(`  ${RECOMMENDED_MODELS.length + 1}. custom`);

	const answer = (
		await rl.question(`Choose [1-${RECOMMENDED_MODELS.length + 1}] (default: ${currentModel}): `)
	).trim();

	if (!answer) {
		return currentModel;
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
}

async function main() {
	const { apiKey: apiKeyArg, model: modelArg, yes } = parseArgs(process.argv.slice(2));
	const existing = await readOpenAIConfig();
	const currentModel = modelArg || existing.defaultModel || DEFAULT_OPENAI_MODEL;
	const currentKey = apiKeyArg || existing.apiKey || process.env.OPENAI_API_KEY || "";

	let apiKey = currentKey;
	let model = currentModel;

	if (!yes) {
		const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
		try {
			if (!apiKey) {
				apiKey = (await rl.question("OpenAI API key (starts with sk-): ")).trim();
			} else {
				const keep = (await rl.question("Keep existing API key from env/config? [Y/n]: ")).trim().toLowerCase();
				if (keep === "n" || keep === "no") {
					apiKey = (await rl.question("OpenAI API key (starts with sk-): ")).trim();
				}
			}
			model = await chooseModel(rl, currentModel);
		} finally {
			rl.close();
		}
	}

	if (!apiKey) {
		throw new Error("OpenAI API key is required.");
	}
	if (!isLikelyApiKey(apiKey)) {
		throw new Error("OpenAI API key looks invalid. Expected a key starting with 'sk-'.");
	}

	await writeOpenAIConfig({
		apiKey,
		defaultModel: model || DEFAULT_OPENAI_MODEL,
		updatedAt: new Date().toISOString(),
	});

	console.log(`Saved OpenAI config to ${OPENAI_CONFIG_PATH}`);
	console.log("You can now run:");
	console.log('  npm run xurl:analyze -- "https://x.com/user/status/1234567890"');
	console.log("Override model per-run with:");
	console.log('  npm run xurl:analyze -- "https://x.com/user/status/1234567890" --model gpt-4.1');
}

main().catch((error) => {
	console.error(`Error: ${error.message || String(error)}`);
	printUsage();
	process.exit(1);
});
