/**
 * AI model provider configuration.
 * Loaded from environment; defaults to mock for local development.
 */

export type ModelProviderType =
  | "nvidia"
  | "azure-openai"
  | "openai"
  | "gemini"
  | "bedrock"
  | "kimi"
  | "mock";

export const SUPPORTED_MODEL_PROVIDERS: readonly ModelProviderType[] = [
  "nvidia",
  "azure-openai",
  "openai",
  "gemini",
  "bedrock",
  "kimi",
  "mock",
] as const;

export const DEFAULT_MODEL_PROVIDER: ModelProviderType = "mock";

const PROVIDER_ALIASES: Record<string, ModelProviderType> = {
  nvidia: "nvidia",
  "azure-openai": "azure-openai",
  azure: "azure-openai",
  openai: "openai",
  gemini: "gemini",
  bedrock: "bedrock",
  aws: "bedrock",
  "aws-bedrock": "bedrock",
  kimi: "kimi",
  mock: "mock",
};

export function isModelProviderType(value: string): value is ModelProviderType {
  return (SUPPORTED_MODEL_PROVIDERS as readonly string[]).includes(value);
}

/**
 * Resolves MODEL_PROVIDER from the environment with a safe default.
 */
export function getModelProviderType(): ModelProviderType {
  const raw = process.env.MODEL_PROVIDER?.trim().toLowerCase();

  if (!raw) {
    return DEFAULT_MODEL_PROVIDER;
  }

  const resolved = PROVIDER_ALIASES[raw] ?? raw;

  if (!isModelProviderType(resolved)) {
    console.warn(
      `[model.config] Unknown MODEL_PROVIDER "${raw}"; falling back to "${DEFAULT_MODEL_PROVIDER}".`
    );
    return DEFAULT_MODEL_PROVIDER;
  }

  return resolved;
}

export interface ModelProviderEnvConfig {
  provider: ModelProviderType;
  /** Provider-specific API key (not used until real integrations ship). */
  apiKey?: string;
  /** Provider-specific base URL override. */
  baseUrl?: string;
  /** Default model identifier for the active provider. */
  modelId?: string;
}

/**
 * Loads provider selection and optional credentials from the environment.
 * Credential fields are placeholders for future real integrations.
 */
export function loadModelProviderConfig(): ModelProviderEnvConfig {
  const provider = getModelProviderType();

  return {
    provider,
    apiKey: process.env.MODEL_API_KEY,
    baseUrl: process.env.MODEL_BASE_URL,
    modelId: process.env.MODEL_ID,
  };
}
