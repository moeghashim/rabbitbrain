#!/usr/bin/env node

import process from "node:process";
import readline from "node:readline/promises";
import {
	AI_CONFIG_PATH,
	DEFAULT_MODELS,
	DEFAULT_PROVIDER,
	getProviderOption,
	PROVIDER_OPTIONS,
	RECOMMENDED_MODELS,
	readAIConfig,
	writeAIConfig,
} from "./lib/ai-config.mjs";

function printUsage() {
	console.log(
		[
			"Usage:",
			"  npm run xurl:analyze:auth",
			"  npm run xurl:analyze:auth -- --provider openai --api-key <KEY> --model <MODEL> --yes",
			"",
			"Options:",
			"  --provider <ID>   Select provider (openai, google, xai, anthropic)",
			"  --api-key <KEY>   Set API key non-interactively",
			"  --model <MODEL>   Set default model",
			"  --yes             Skip interactive prompts where possible",
			"  -h, --help        Show help",
		].join("\n"),
	);
}

function parseArgs(argv) {
	let provider = "";
	let apiKey = "";
	let model = "";
	let yes = false;

	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--provider") {
			const value = argv[i + 1];
			if (!value) {
				throw new Error("Missing value for --provider");
			}
			provider = value.trim();
			i += 1;
			continue;
		}
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

	return { provider, apiKey, model, yes };
}

function isLikelyApiKey(value, provider) {
	if (provider === "openai") {
		return value.startsWith("sk-");
	}
	if (provider === "anthropic") {
		return value.startsWith("sk-ant-");
	}
	return value.length >= 12;
}

async function chooseProvider(rl, currentProvider) {
	console.log("\nSelect provider:");
	PROVIDER_OPTIONS.forEach((provider, index) => {
		const marker = provider.id === currentProvider ? " (current)" : "";
		console.log(`  ${index + 1}. ${provider.label}${marker}`);
	});
	const answer = (await rl.question(`Choose [1-${PROVIDER_OPTIONS.length}] (default: ${currentProvider}): `)).trim();
	if (!answer) {
		return currentProvider;
	}
	const selected = Number.parseInt(answer, 10);
	if (Number.isNaN(selected) || selected < 1 || selected > PROVIDER_OPTIONS.length) {
		throw new Error(`Invalid provider selection: ${answer}`);
	}
	return PROVIDER_OPTIONS[selected - 1]?.id ?? currentProvider;
}

async function chooseModel(rl, provider, currentModel) {
	const models = RECOMMENDED_MODELS[provider];
	console.log(`\nSelect default model for ${getProviderOption(provider).label}:`);
	models.forEach((name, index) => {
		const marker = name === currentModel ? " (current)" : "";
		console.log(`  ${index + 1}. ${name}${marker}`);
	});

	const answer = (await rl.question(`Choose [1-${models.length}] (default: ${currentModel}): `)).trim();

	if (!answer) {
		return currentModel;
	}

	const selected = Number.parseInt(answer, 10);
	if (Number.isNaN(selected) || selected < 1 || selected > models.length) {
		throw new Error(`Invalid model selection: ${answer}`);
	}

	return models[selected - 1];
}

async function main() {
	const { provider: providerArg, apiKey: apiKeyArg, model: modelArg, yes } = parseArgs(process.argv.slice(2));
	const existing = await readAIConfig();
	const providerIds = new Set(PROVIDER_OPTIONS.map((item) => item.id));
	const currentProvider = providerIds.has(providerArg) ? providerArg : existing.defaultProvider || DEFAULT_PROVIDER;
	const currentModel = modelArg || existing.defaultModel || DEFAULT_MODELS[currentProvider];
	const currentKey =
		apiKeyArg ||
		existing.providers?.[currentProvider]?.apiKey ||
		process.env[getProviderOption(currentProvider).envVar] ||
		"";

	let provider = currentProvider;
	let apiKey = currentKey;
	let model = currentModel;

	if (!yes) {
		const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
		try {
			provider = await chooseProvider(rl, currentProvider);
			if (!apiKey) {
				apiKey = (await rl.question(`${getProviderOption(provider).label} API key: `)).trim();
			} else {
				const keep = (await rl.question("Keep existing API key from env/config? [Y/n]: ")).trim().toLowerCase();
				if (keep === "n" || keep === "no") {
					apiKey = (await rl.question(`${getProviderOption(provider).label} API key: `)).trim();
				}
			}
			model = await chooseModel(rl, provider, model || DEFAULT_MODELS[provider]);
		} finally {
			rl.close();
		}
	}

	if (!apiKey) {
		throw new Error(`${getProviderOption(provider).label} API key is required.`);
	}
	if (!isLikelyApiKey(apiKey, provider)) {
		throw new Error(`${getProviderOption(provider).label} API key looks invalid.`);
	}

	await writeAIConfig({
		defaultProvider: provider,
		defaultModel: model || DEFAULT_MODELS[provider],
		providers: {
			...(existing.providers ?? {}),
			[provider]: {
				apiKey,
				updatedAt: new Date().toISOString(),
			},
		},
		updatedAt: new Date().toISOString(),
	});

	console.log(`Saved AI config to ${AI_CONFIG_PATH}`);
	console.log("You can now run:");
	console.log(`  npm run xurl:analyze -- "https://x.com/user/status/1234567890" --provider ${provider}`);
	console.log("Override model per-run with:");
	console.log(
		`  npm run xurl:analyze -- "https://x.com/user/status/1234567890" --provider ${provider} --model ${model}`,
	);
}

main().catch((error) => {
	console.error(`Error: ${error.message || String(error)}`);
	printUsage();
	process.exit(1);
});
