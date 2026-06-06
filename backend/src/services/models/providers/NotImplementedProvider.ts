import type { ModelProviderType } from "../../../config/model.config";
import type {
  EntityExtractionResult,
  IntentResult,
  ModelProvider,
  OrderingIntent,
  ResponseGenerationInput,
  ResponseGenerationResult,
} from "../types";

const NOT_IMPLEMENTED = "Not implemented";

/**
 * Base skeleton for providers that have not been wired to real APIs yet.
 */
export abstract class NotImplementedProvider implements ModelProvider {
  abstract readonly name: ModelProviderType;

  async classifyIntent(_message: string): Promise<IntentResult> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async extractEntities(
    _message: string,
    _intent?: OrderingIntent
  ): Promise<EntityExtractionResult> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async generateResponse(
    _input: ResponseGenerationInput
  ): Promise<ResponseGenerationResult> {
    throw new Error(NOT_IMPLEMENTED);
  }
}
