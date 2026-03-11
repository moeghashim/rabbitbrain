import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const DEFAULT_CONFIG_DIR = path.join(homedir(), ".config", "rabbitbrain");
const CONFIG_DIR = process.env.RABBITBRAIN_CONFIG_DIR
	? path.resolve(process.env.RABBITBRAIN_CONFIG_DIR)
	: DEFAULT_CONFIG_DIR;

export const AI_CONFIG_PATH = path.join(CONFIG_DIR, "ai-providers.json");
export const LEGACY_OPENAI_CONFIG_PATH = path.join(CONFIG_DIR, "openai-analyze.json");
export const DEFAULT_PROVIDER = "openai";
export const PROVIDER_OPTIONS = [
	{ id: "openai", label: "OpenAI", envVar: "OPENAI_API_KEY" },
	{ id: "google", label: "Gemini", envVar: "GOOGLE_API_KEY" },
	{ id: "xai", label: "Grok", envVar: "XAI_API_KEY" },
	{ id: "anthropic", label: "Claude", envVar: "ANTHROPIC_API_KEY" },
];
export const DEFAULT_MODELS = {
	openai: "gpt-4.1-mini",
	google: "gemini-2.0-flash",
	xai: "grok-3-mini",
	anthropic: "claude-3-5-sonnet-latest",
};
export const RECOMMENDED_MODELS = {
	openai: ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini", "gpt-4o"],
	google: ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-pro"],
	xai: ["grok-3-mini", "grok-3-fast", "grok-2-latest"],
	anthropic: ["claude-3-5-haiku-latest", "claude-3-5-sonnet-latest", "claude-3-7-sonnet-latest"],
};

export function getProviderOption(provider) {
	return PROVIDER_OPTIONS.find((item) => item.id === provider) ?? PROVIDER_OPTIONS[0];
}

async function readJson(pathname) {
	try {
		const raw = await readFile(pathname, "utf8");
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch (error) {
		if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
			return null;
		}
		throw error;
	}
}

function normalizeConfig(parsed) {
	return {
		defaultProvider: parsed.defaultProvider || DEFAULT_PROVIDER,
		defaultModel: parsed.defaultModel || DEFAULT_MODELS[parsed.defaultProvider || DEFAULT_PROVIDER],
		providers: parsed.providers && typeof parsed.providers === "object" ? parsed.providers : {},
		updatedAt: parsed.updatedAt,
	};
}

export async function readAIConfig() {
	const current = await readJson(AI_CONFIG_PATH);
	if (current) {
		return normalizeConfig(current);
	}

	const legacy = await readJson(LEGACY_OPENAI_CONFIG_PATH);
	if (!legacy) {
		return normalizeConfig({});
	}

	return normalizeConfig({
		defaultProvider: "openai",
		defaultModel: legacy.defaultModel || DEFAULT_MODELS.openai,
		providers: {
			openai: {
				apiKey: legacy.apiKey || "",
				updatedAt: legacy.updatedAt,
			},
		},
		updatedAt: legacy.updatedAt,
	});
}

export async function writeAIConfig(config) {
	await mkdir(CONFIG_DIR, { recursive: true });
	const tempPath = `${AI_CONFIG_PATH}.tmp`;
	await writeFile(tempPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
	await chmod(tempPath, 0o600);
	await rename(tempPath, AI_CONFIG_PATH);
}
