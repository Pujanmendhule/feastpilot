import type { ModelProviderType } from "../../config/model.config";

/** High-level ordering intents the agent will route to tools. */
export type OrderingIntent =
  | "search_restaurants"
  | "select_restaurant"
  | "show_menu"
  | "add_to_cart"
  | "add_another"
  | "remove_item"
  | "set_quantity"
  | "view_cart"
  | "unknown";

export interface IntentResult {
  /** Classified intent for the user message. */
  intent: OrderingIntent;
  /** Confidence score in the range [0, 1]. */
  confidence: number;
  /** Original user message that was classified. */
  rawMessage: string;
}

export interface EntityExtractionResult {
  /** Natural-language menu item reference, when applicable. */
  item?: string;
  /** Parsed quantity for cart operations. */
  quantity?: number;
  /** Restaurant name or selection hint. */
  restaurant?: string;
  /** Food or cuisine search terms. */
  searchQuery?: string;
  /** Flat entity map for extensibility and provider-specific fields. */
  entities: Record<string, string | number | boolean | null>;
}

export interface ResponseGenerationInput {
  /** Intent that triggered response generation. */
  intent: OrderingIntent;
  /** Structured entities extracted from the user message. */
  entities?: EntityExtractionResult;
  /** Optional tool execution result to ground the response. */
  toolResult?: unknown;
  /** Optional session snapshot for contextual replies. */
  sessionContext?: Record<string, unknown>;
  /** Original user message. */
  userMessage: string;
}

export interface ResponseGenerationResult {
  /** Human-readable agent response text. */
  response: string;
  /** Provider that generated the response. */
  provider: ModelProviderType;
}

/**
 * Contract for all AI model providers.
 * Task-oriented methods map to future ordering-agent pipeline stages.
 */
export interface ModelProvider {
  readonly name: ModelProviderType;

  /** Classify the user's intent from natural language. */
  classifyIntent(message: string): Promise<IntentResult>;

  /** Extract structured entities given a message and optional intent hint. */
  extractEntities(
    message: string,
    intent?: OrderingIntent
  ): Promise<EntityExtractionResult>;

  /** Generate a conversational response from intent, entities, and context. */
  generateResponse(
    input: ResponseGenerationInput
  ): Promise<ResponseGenerationResult>;
}
