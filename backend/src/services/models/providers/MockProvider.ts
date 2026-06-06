import type { ModelProviderType } from "../../../config/model.config";
import type {
  EntityExtractionResult,
  IntentResult,
  ModelProvider,
  OrderingIntent,
  ResponseGenerationInput,
  ResponseGenerationResult,
} from "../types";

const SEARCH_KEYWORDS = ["restaurant", "food", "biryani", "pizza", "burger"];
const MENU_KEYWORDS = ["menu", "show menu", "view menu"];

const ITEM_QUERY_STOP_WORDS = new Set([
  "add",
  "order",
  "another",
  "one",
  "more",
  "please",
  "the",
  "a",
  "an",
  "to",
  "some",
]);

function normalize(message: string): string {
  return message.trim().toLowerCase();
}

function extractItemQuery(message: string): string {
  return normalize(message)
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0 && !ITEM_QUERY_STOP_WORDS.has(word))
    .join(" ")
    .trim();
}

function extractSearchQuery(message: string): string {
  const stopWords = new Set([
    "i",
    "want",
    "need",
    "show",
    "me",
    "can",
    "you",
    "please",
    "looking",
    "for",
    "suggest",
    "some",
    "a",
    "an",
    "the",
    "places",
    "restaurant",
    "restaurants",
  ]);

  const words = normalize(message)
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !stopWords.has(word));

  return words.join(" ").trim() || normalize(message);
}

function isViewCartMessage(normalized: string): boolean {
  return (
    /^(show|view)\s+cart$/.test(normalized) ||
    normalized === "my cart" ||
    normalized === "cart" ||
    /\b(show|view)\s+cart\b/.test(normalized) ||
    /\bmy\s+cart\b/.test(normalized)
  );
}

function classifyOrderingIntent(message: string): OrderingIntent {
  const normalized = normalize(message);

  if (MENU_KEYWORDS.some((kw) => normalized.includes(kw))) {
    return "show_menu";
  }

  if (isViewCartMessage(normalized)) {
    return "view_cart";
  }

  const setQuantityMatch = normalized.match(
    /^change\s+(.+?)\s+quantity\s+to\s+(\d+)$/
  );
  if (setQuantityMatch) {
    return "set_quantity";
  }

  if (normalized.startsWith("remove ")) {
    return "remove_item";
  }

  if (/\badd\b/.test(normalized) && /\b(another|one more)\b/.test(normalized)) {
    return "add_another";
  }

  if (/\b(add|order)\b/.test(normalized)) {
    return "add_to_cart";
  }

  if (SEARCH_KEYWORDS.some((kw) => normalized.includes(kw))) {
    return "search_restaurants";
  }

  return "unknown";
}

/**
 * Deterministic mock provider for local development and tests.
 * Mirrors keyword routing patterns used by plannerNode today.
 */
export class MockProvider implements ModelProvider {
  readonly name: ModelProviderType = "mock";

  async classifyIntent(message: string): Promise<IntentResult> {
    return {
      intent: classifyOrderingIntent(message),
      confidence: 1,
      rawMessage: message,
    };
  }

  async extractEntities(
    message: string,
    intent?: OrderingIntent
  ): Promise<EntityExtractionResult> {
    const normalized = normalize(message);
    const resolvedIntent = intent ?? classifyOrderingIntent(message);
    const entities: Record<string, string | number | boolean | null> = {};

    if (resolvedIntent === "search_restaurants") {
      const searchQuery = extractSearchQuery(message);
      entities.searchQuery = searchQuery;
      return { searchQuery, entities };
    }

    if (
      resolvedIntent === "add_to_cart" ||
      resolvedIntent === "add_another" ||
      resolvedIntent === "remove_item" ||
      resolvedIntent === "set_quantity"
    ) {
      let item = "";
      let quantity = 1;

      const setQuantityMatch = normalized.match(
        /^change\s+(.+?)\s+quantity\s+to\s+(\d+)$/
      );
      if (setQuantityMatch) {
        item = setQuantityMatch[1].trim();
        quantity = Number(setQuantityMatch[2]);
      } else if (normalized.startsWith("remove ")) {
        item = normalized.slice("remove ".length).trim();
      } else {
        item = extractItemQuery(message);
      }

      entities.item = item;
      entities.quantity = quantity;

      return { item, quantity, entities };
    }

    if (resolvedIntent === "select_restaurant") {
      const restaurant = message.trim();
      entities.restaurant = restaurant;
      return { restaurant, entities };
    }

    return { entities };
  }

  async generateResponse(
    input: ResponseGenerationInput
  ): Promise<ResponseGenerationResult> {
    const item = input.entities?.item;
    const quantity = input.entities?.quantity ?? 1;

    let response: string;

    switch (input.intent) {
      case "show_menu":
        response = "Here is the menu for your selected restaurant.";
        break;
      case "add_to_cart":
        response = `Added ${item ?? "item"} to your cart (qty ${quantity}).`;
        break;
      case "add_another":
        response = `Added another ${item ?? "item"} to your cart.`;
        break;
      case "remove_item":
        response = `Removed ${item ?? "item"} from your cart.`;
        break;
      case "set_quantity":
        response = `Updated ${item ?? "item"} quantity to ${quantity}.`;
        break;
      case "view_cart":
        response = "Here is your current cart.";
        break;
      case "search_restaurants":
        response = `Searching for restaurants matching "${input.entities?.searchQuery ?? input.userMessage}".`;
        break;
      case "select_restaurant":
        response = `Selected restaurant: ${input.entities?.restaurant ?? "unknown"}.`;
        break;
      default:
        response = "I can help you search restaurants, view menus, and manage your cart.";
    }

    return {
      response,
      provider: this.name,
    };
  }
}
