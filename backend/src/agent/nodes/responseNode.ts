import type { AgentState } from "../state/agentState";
import type {
  SelectRestaurantResult,
  CartOperationResult,
} from "../types/toolResults";
import type { SearchRestaurantsResult, GetMenuResult } from "../tools";
import { formatCartSummary } from "../utils/cartRenderer";
import type { RecommendationResult } from "../utils/recommendationEngine";

const MAX_ITEMS = 5;

// ── Type guards ────────────────────────────────────────────────────────────

function isSearchResult(value: unknown): value is SearchRestaurantsResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "data" in value &&
    Array.isArray((value as SearchRestaurantsResult).data) &&
    ((value as SearchRestaurantsResult).data.length === 0 ||
      "rating" in (value as SearchRestaurantsResult).data[0])
  );
}

function isMenuResult(value: unknown): value is GetMenuResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "data" in value &&
    Array.isArray((value as GetMenuResult).data) &&
    ((value as GetMenuResult).data.length === 0 ||
      "price" in (value as GetMenuResult).data[0])
  );
}

function isSelectRestaurantResult(
  value: unknown
): value is SelectRestaurantResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "data" in value &&
    ((value as SelectRestaurantResult).data === null ||
      (typeof (value as SelectRestaurantResult).data === "object" &&
        (value as SelectRestaurantResult).data !== null &&
        "id" in (value as SelectRestaurantResult).data! &&
        "name" in (value as SelectRestaurantResult).data!))
  );
}

function isCartOperationResult(
  value: unknown
): value is CartOperationResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "action" in value &&
    "data" in value
  );
}

// ── Renderers ──────────────────────────────────────────────────────────────

function renderSearchResult(result: SearchRestaurantsResult): string {
  const count = result.data.length;
  if (count === 0) return "No restaurants found matching your request.";

  const names = result.data
    .slice(0, MAX_ITEMS)
    .map((r) => `• ${r.name}`)
    .join("\n");

  return `Found ${count} restaurant${count === 1 ? "" : "s"}:\n\n${names}\n\nPlease select one.`;
}

function renderSelectRestaurantResult(result: SelectRestaurantResult): string {
  if (!result.success || !result.data) {
    return (
      result.error ??
      "Could not match that to a restaurant. Please choose from the list."
    );
  }

  return `Selected restaurant:\n\n${result.data.name}\n\nYou can now:\n• show menu\n• add items\n• view cart`;
}

function renderMenuResult(result: GetMenuResult): string {
  const count = result.data.length;
  if (count === 0) return "No menu items found for this restaurant.";

  const items = result.data
    .slice(0, MAX_ITEMS)
    .map((item) => `• ${item.name}`)
    .join("\n");

  return `Menu contains ${count} item${count === 1 ? "" : "s"}:\n${items}`;
}

function renderCartOperationResult(result: CartOperationResult): string {
  if (!result.success || !result.data) {
    return result.error ?? "Cart operation failed.";
  }

  if (result.action === "view") {
    if (result.data.items.length === 0) {
      return "Your cart is empty.";
    }

    return formatCartSummary(result.data).replace(
      "Your cart:",
      "Your cart contains:"
    );
  }

  if (result.action === "add") {
    return `Added ${result.itemName}.\n\nCart subtotal: ₹${result.data.subtotal}`;
  }

  if (result.action === "addAnother") {
    return `Added another ${result.itemName}.\n\nCart subtotal: ₹${result.data.subtotal}`;
  }

  if (result.action === "remove") {
    return `Removed ${result.itemName}.\n\nSubtotal: ₹${result.data.subtotal}`;
  }

  if (result.action === "setQuantity") {
    return `Updated ${result.itemName} quantity to ${result.quantity}.\n\nSubtotal: ₹${result.data.subtotal}`;
  }

  return formatCartSummary(result.data);
}

// ── Node ───────────────────────────────────────────────────────────────────

/**
 * Response Node
 *
 * Produces the final human-readable response from toolResult.
 */
export async function responseNode(state: AgentState): Promise<AgentState> {
  let agentResponse: string;

  // ── Clarification question (highest priority when set) ────────────────────
  if (state.awaitingRecommendationClarification && state.recommendationClarificationQuestion) {
    agentResponse = state.recommendationClarificationQuestion;
  } else if (state.recommendationResult !== null && state.recommendationResult !== undefined) {
    agentResponse = state.recommendationResult.rationale;
  } else if (state.plannedTool === "recommend") {
    // Engine ran but found nothing
    agentResponse = "I couldn't find a suitable recommendation based on the current menu. Try asking for something specific like a dessert or a vegetarian option.";
  } else if (state.toolResult === undefined) {
    agentResponse = "LangGraph response pipeline active.";
  } else if (isCartOperationResult(state.toolResult)) {
    agentResponse = renderCartOperationResult(state.toolResult);
  } else if (isSelectRestaurantResult(state.toolResult)) {
    agentResponse = renderSelectRestaurantResult(state.toolResult);
  } else if (isSearchResult(state.toolResult)) {
    agentResponse = renderSearchResult(state.toolResult);
  } else if (isMenuResult(state.toolResult)) {
    agentResponse = renderMenuResult(state.toolResult);
  } else {
    agentResponse = "Tool executed successfully.";
  }

  return {
    ...state,
    agentResponse,
    toolCalls: [...state.toolCalls, "response-node"],
  };
}
