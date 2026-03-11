import type { ProviderId } from "@pi-starter/contracts";

export interface ProviderCatalogEntry {
	id: ProviderId;
	label: string;
	envVar: string;
	keyHint: string;
	defaultModel: string;
	models: readonly string[];
}

export const PROVIDER_CATALOG: Record<ProviderId, ProviderCatalogEntry> = {
	openai: {
		id: "openai",
		label: "OpenAI",
		envVar: "OPENAI_API_KEY",
		keyHint: "Starts with sk-",
		defaultModel: "gpt-4.1-mini",
		models: ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini", "gpt-4o"],
	},
	google: {
		id: "google",
		label: "Gemini",
		envVar: "GOOGLE_API_KEY",
		keyHint: "Google AI Studio API key",
		defaultModel: "gemini-2.0-flash",
		models: ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-pro"],
	},
	xai: {
		id: "xai",
		label: "Grok",
		envVar: "XAI_API_KEY",
		keyHint: "xAI API key",
		defaultModel: "grok-3-mini",
		models: ["grok-3-mini", "grok-3-fast", "grok-2-latest"],
	},
	anthropic: {
		id: "anthropic",
		label: "Claude",
		envVar: "ANTHROPIC_API_KEY",
		keyHint: "Starts with sk-ant-",
		defaultModel: "claude-3-5-sonnet-latest",
		models: ["claude-3-5-haiku-latest", "claude-3-5-sonnet-latest", "claude-3-7-sonnet-latest"],
	},
};

export const PROVIDER_OPTIONS = Object.values(PROVIDER_CATALOG);

export function getProviderCatalogEntry(provider: ProviderId): ProviderCatalogEntry {
	return PROVIDER_CATALOG[provider];
}
