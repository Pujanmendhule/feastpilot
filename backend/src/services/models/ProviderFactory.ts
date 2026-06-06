import type { ModelProviderType } from "../../config/model.config";
import {
  getModelProviderType,
  loadModelProviderConfig,
} from "../../config/model.config";
import type { ModelProvider } from "./types";
import {
  AzureOpenAIProvider,
  BedrockProvider,
  GeminiProvider,
  KimiProvider,
  MockProvider,
  NvidiaProvider,
  OpenAIProvider,
} from "./providers";

/**
 * Instantiates the correct {@link ModelProvider} for the given type.
 */
export function createProvider(
  providerType: ModelProviderType = getModelProviderType()
): ModelProvider {
  const config = loadModelProviderConfig();

  switch (providerType) {
    case "mock":
      return new MockProvider();
    case "nvidia":
      return new NvidiaProvider();
    case "azure-openai":
      return new AzureOpenAIProvider();
    case "openai":
      return new OpenAIProvider();
    case "gemini":
      return new GeminiProvider();
    case "bedrock":
      return new BedrockProvider();
    case "kimi":
      return new KimiProvider(config);
    default: {
      const exhaustive: never = providerType;
      throw new Error(`Unsupported model provider: ${exhaustive}`);
    }
  }
}

/** Cached provider instance keyed by resolved MODEL_PROVIDER value. */
let cachedProvider: ModelProvider | null = null;
let cachedProviderType: ModelProviderType | null = null;

/**
 * Returns a singleton provider for the active MODEL_PROVIDER setting.
 * Recreates the instance when the provider type changes (e.g. in tests).
 */
export function getProvider(): ModelProvider {
  const providerType = getModelProviderType();

  if (!cachedProvider || cachedProviderType !== providerType) {
    cachedProvider = createProvider(providerType);
    cachedProviderType = providerType;
  }

  return cachedProvider;
}

/** Clears the cached provider — useful in tests when MODEL_PROVIDER changes. */
export function resetProviderCache(): void {
  cachedProvider = null;
  cachedProviderType = null;
}
