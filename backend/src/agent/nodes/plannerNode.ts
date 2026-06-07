import type { AgentState } from "../state/agentState";
import { DEFAULT_QUANTITY, DEFAULT_RESTAURANT_ID } from "../constants";
import { extractSearchQuery } from "../utils/queryExtractor";
import { matchRestaurantSelection } from "../utils/restaurantMatcher";
import { parseCartIntent } from "../utils/cartIntentParser";
import { sessionService } from "../../services/SessionService";
import { modelService } from "../../services/models/ModelService";
import type { EntityExtractionResult, IntentResult } from "../../services/models/types";

/** Minimum confidence for the Azure result to be used as primary source. */
const CONFIDENCE_THRESHOLD = 0.6;

/** Keywords that trigger a restaurant search */
const SEARCH_KEYWORDS = ["restaurant", "food", "biryani", "pizza", "burger"];

/** Keywords that trigger a menu fetch */
const MENU_KEYWORDS = ["menu", "show menu", "view menu"];

function resolveRestaurantId(sessionId: string): string {
  const selectedRestaurantId = sessionService.getSession(sessionId)
    ?.selectedRestaurantId;
  return selectedRestaurantId ?? DEFAULT_RESTAURANT_ID;
}

/**
 * Log planner decision with intent, confidence, and extracted entities.
 * Only called when ModelService succeeds.
 */
function logPlannerDecision(
  intent: IntentResult,
  entities: EntityExtractionResult
): void {
  console.log(`[Planner] Provider  : ${modelService.getProviderType()}`);
  console.log(`[Planner] Intent    : ${intent.intent}`);
  console.log(`[Planner] Confidence: ${intent.confidence.toFixed(2)}`);
  console.log(
    `[Planner] Entities  : item="${entities.item ?? "—"}" ` +
    `quantity=${entities.quantity ?? "—"} ` +
    `restaurant="${entities.restaurant ?? "—"}" ` +
    `searchQuery="${entities.searchQuery ?? "—"}"`
  );
}

/**
 * Fallback Keyword Planner
 *
 * Analyses state.userMessage using legacy keyword routing rules.
 * Used when:
 *   - ModelService throws an error
 *   - Confidence is below CONFIDENCE_THRESHOLD
 *   - Intent is "unknown" and no entity was extracted
 */
function fallbackKeywordPlanner(state: AgentState): AgentState {
  const lowerMessage = state.userMessage.toLowerCase();

  if (sessionService.isAwaitingRestaurantSelection(state.sessionId)) {
    const candidates = sessionService.getLastSearchResults(state.sessionId);
    const match = matchRestaurantSelection(state.userMessage, candidates);

    return {
      ...state,
      plannedTool: "selectRestaurant",
      restaurantId: match?.id ?? null,
      toolCalls: [...state.toolCalls, "planner"],
    };
  }

  if (MENU_KEYWORDS.some((kw) => lowerMessage.includes(kw))) {
    return {
      ...state,
      plannedTool: "getMenu",
      restaurantId: resolveRestaurantId(state.sessionId),
      toolCalls: [...state.toolCalls, "planner"],
    };
  }

  const cartIntent = parseCartIntent(state.userMessage);
  if (cartIntent) {
    const restaurantId = resolveRestaurantId(state.sessionId);

    if (cartIntent.type === "view") {
      return {
        ...state,
        plannedTool: "getCart",
        restaurantId,
        cartAction: "view",
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    if (cartIntent.type === "remove") {
      return {
        ...state,
        plannedTool: "removeFromCart",
        restaurantId,
        cartAction: "remove",
        menuItemQuery: cartIntent.itemQuery,
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    if (cartIntent.type === "setQuantity") {
      return {
        ...state,
        plannedTool: "setCartQuantity",
        restaurantId,
        cartAction: "setQuantity",
        menuItemQuery: cartIntent.itemQuery,
        quantity: cartIntent.quantity,
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    return {
      ...state,
      plannedTool: "addToCart",
      restaurantId,
      cartAction: cartIntent.type,
      menuItemQuery: cartIntent.itemQuery,
      quantity: cartIntent.quantity,
      toolCalls: [...state.toolCalls, "planner"],
    };
  }

  if (SEARCH_KEYWORDS.some((kw) => lowerMessage.includes(kw))) {
    return {
      ...state,
      plannedTool: "searchRestaurants",
      searchQuery: extractSearchQuery(state.userMessage),
      toolCalls: [...state.toolCalls, "planner"],
    };
  }

  return {
    ...state,
    plannedTool: null,
    toolCalls: [...state.toolCalls, "planner"],
  };
}

/**
 * Planner Node
 *
 * Primary path:
 *   1. Call ModelService.classifyIntent() — uses the configured provider (Azure, mock, …)
 *   2. If confidence >= CONFIDENCE_THRESHOLD, call extractEntities()
 *   3. Populate AgentState directly from extracted entities
 *   4. Map intent → plannedTool
 *
 * Fallback conditions (legacy keyword planner):
 *   - ModelService throws (network error, misconfiguration, …)
 *   - intent === "unknown"
 *   - confidence < CONFIDENCE_THRESHOLD
 *   - Required entities are missing AND legacy parser can fill them
 */
export async function plannerNode(state: AgentState): Promise<AgentState> {
  // Restaurant-selection state takes absolute precedence regardless of provider.
  if (sessionService.isAwaitingRestaurantSelection(state.sessionId)) {
    const candidates = sessionService.getLastSearchResults(state.sessionId);
    const match = matchRestaurantSelection(state.userMessage, candidates);

    return {
      ...state,
      plannedTool: "selectRestaurant",
      restaurantId: match?.id ?? null,
      toolCalls: [...state.toolCalls, "planner"],
    };
  }

  // ── ModelService (primary) ─────────────────────────────────────────────────
  let intentResult: IntentResult;
  try {
    intentResult = await modelService.classifyIntent(state.userMessage);
  } catch (error) {
    console.warn(
      `[Planner] classifyIntent failed (${modelService.getProviderType()}), falling back to keywords:`,
      error
    );
    return fallbackKeywordPlanner(state);
  }

  // Fall back if intent is unknown or confidence is too low.
  if (
    intentResult.intent === "unknown" ||
    intentResult.confidence < CONFIDENCE_THRESHOLD
  ) {
    console.log(
      `[Planner] Low-confidence or unknown intent ` +
      `(intent=${intentResult.intent}, confidence=${intentResult.confidence.toFixed(2)}). ` +
      `Using keyword fallback.`
    );
    return fallbackKeywordPlanner(state);
  }

  // ── Entity extraction ──────────────────────────────────────────────────────
  let entities: EntityExtractionResult;
  try {
    entities = await modelService.extractEntities(
      state.userMessage,
      intentResult.intent
    );
  } catch (error) {
    console.warn(
      `[Planner] extractEntities failed, proceeding without entities:`,
      error
    );
    entities = { entities: {} };
  }

  logPlannerDecision(intentResult, entities);

  const restaurantId = resolveRestaurantId(state.sessionId);

  // ── Intent → Tool mapping ──────────────────────────────────────────────────
  switch (intentResult.intent) {

    // ── show_menu ─────────────────────────────────────────────────────────────
    case "show_menu":
      return {
        ...state,
        plannedTool: "getMenu",
        restaurantId,
        toolCalls: [...state.toolCalls, "planner"],
      };

    // ── search_restaurants ────────────────────────────────────────────────────
    case "search_restaurants": {
      // Primary: Azure entity. Fallback: legacy extractor.
      const searchQuery =
        entities.searchQuery ?? extractSearchQuery(state.userMessage);
      return {
        ...state,
        plannedTool: "searchRestaurants",
        searchQuery,
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    // ── select_restaurant ─────────────────────────────────────────────────────
    case "select_restaurant": {
      // Match the extracted restaurant name against the session candidate list.
      const candidates = sessionService.getLastSearchResults(state.sessionId);
      const nameHint = entities.restaurant ?? state.userMessage;
      const match = matchRestaurantSelection(nameHint, candidates);
      return {
        ...state,
        plannedTool: "selectRestaurant",
        restaurantId: match?.id ?? null,
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    // ── add_to_cart ───────────────────────────────────────────────────────────
    case "add_to_cart": {
      // Primary entities from Azure; fall back to legacy cart parser for item/qty.
      const cartIntent = !entities.item ? parseCartIntent(state.userMessage) : null;
      const menuItemQuery = entities.item ?? cartIntent?.itemQuery ?? null;
      const quantity =
        entities.quantity ??
        cartIntent?.quantity ??
        state.quantity ??
        DEFAULT_QUANTITY;

      return {
        ...state,
        plannedTool: "updateCart",
        restaurantId,
        cartAction: "add",
        menuItemQuery,
        quantity,
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    // ── add_another ───────────────────────────────────────────────────────────
    case "add_another": {
      const cartIntent = !entities.item ? parseCartIntent(state.userMessage) : null;
      const menuItemQuery = entities.item ?? cartIntent?.itemQuery ?? null;
      const quantity =
        entities.quantity ??
        cartIntent?.quantity ??
        state.quantity ??
        DEFAULT_QUANTITY;

      return {
        ...state,
        plannedTool: "updateCart",
        restaurantId,
        cartAction: "addAnother",
        menuItemQuery,
        quantity,
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    // ── remove_item ───────────────────────────────────────────────────────────
    case "remove_item": {
      const cartIntent = !entities.item ? parseCartIntent(state.userMessage) : null;
      const menuItemQuery = entities.item ?? cartIntent?.itemQuery ?? null;

      return {
        ...state,
        plannedTool: "removeFromCart",
        restaurantId,
        cartAction: "remove",
        menuItemQuery,
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    // ── view_cart ─────────────────────────────────────────────────────────────
    case "view_cart":
      return {
        ...state,
        plannedTool: "getCart",
        restaurantId,
        cartAction: "view",
        toolCalls: [...state.toolCalls, "planner"],
      };

    // ── set_quantity ──────────────────────────────────────────────────────────
    case "set_quantity": {
      const cartIntent = !entities.item ? parseCartIntent(state.userMessage) : null;
      const menuItemQuery = entities.item ?? cartIntent?.itemQuery ?? null;
      const quantity =
        entities.quantity ??
        cartIntent?.quantity ??
        state.quantity ??
        DEFAULT_QUANTITY;

      return {
        ...state,
        plannedTool: "setCartItemQuantity",
        restaurantId,
        cartAction: "setQuantity",
        menuItemQuery,
        quantity,
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    // ── unknown / unhandled ───────────────────────────────────────────────────
    default:
      console.log(`[Planner] Unhandled intent "${intentResult.intent}", using keyword fallback.`);
      return fallbackKeywordPlanner(state);
  }
}
