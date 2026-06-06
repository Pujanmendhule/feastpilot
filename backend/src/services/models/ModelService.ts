import type { ModelProviderType } from "../../config/model.config";
import { getModelProviderType } from "../../config/model.config";
import { getProvider } from "./ProviderFactory";
import type {
  EntityExtractionResult,
  IntentResult,
  ModelProvider,
  OrderingIntent,
  ResponseGenerationInput,
  ResponseGenerationResult,
} from "./types";

/**
 * Abstraction layer between the agent and AI providers.
 * AgentService delegates here in the future without knowing the active vendor.
 */
export class ModelService {
  private readonly provider: ModelProvider;

  constructor(provider: ModelProvider = getProvider()) {
    this.provider = provider;
  }

  /** Active provider identifier (e.g. mock, nvidia, azure-openai). */
  getProviderType(): ModelProviderType {
    return this.provider.name;
  }

  /** Resolved MODEL_PROVIDER from environment (may differ before factory bind). */
  getConfiguredProviderType(): ModelProviderType {
    return getModelProviderType();
  }

  async classifyIntent(message: string): Promise<IntentResult> {
    return this.provider.classifyIntent(message);
  }

  async extractEntities(
    message: string,
    intent?: OrderingIntent
  ): Promise<EntityExtractionResult> {
    return this.provider.extractEntities(message, intent);
  }

  async generateResponse(
    input: ResponseGenerationInput
  ): Promise<ResponseGenerationResult> {
    return this.provider.generateResponse(input);
  }
}

/** Shared model service entry point for routes and future agent integration. */
export const modelService = new ModelService();
