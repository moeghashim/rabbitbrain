export interface OpenAIConfig {
	apiKey?: string;
	defaultModel?: string;
	updatedAt?: string;
	[key: string]: unknown;
}

export const OPENAI_CONFIG_PATH: string;
export const DEFAULT_OPENAI_MODEL: string;
export const RECOMMENDED_MODELS: string[];

export function readOpenAIConfig(): Promise<OpenAIConfig>;
export function writeOpenAIConfig(config: OpenAIConfig): Promise<void>;
