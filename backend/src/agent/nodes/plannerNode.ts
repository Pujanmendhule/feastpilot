import type { AgentState } from "../state/agentState";
import { DEFAULT_RESTAURANT_ID } from "../constants";
import { extractSearchQuery } from "../utils/queryExtractor";
import { matchRestaurantSelection } from "../utils/restaurantMatcher";
import { parseCartIntent } from "../utils/cartIntentParser";
import { sessionService } from "../../services/SessionService";

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
 * Planner Node
 *
 * Analyses state.userMessage and sets plannedTool + required context fields.
 *
 * Routing rules (priority order, keyword-based, no LLM):
 *  0. awaitingRestaurantSelection → plannedTool = "selectRestaurant"
 *  1. MENU keywords  → plannedTool = "getMenu"
 *  2. Cart intents   → getCart / addToCart / removeFromCart / setCartQuantity
 *  3. SEARCH keywords→ plannedTool = "searchRestaurants"
 *  4. Otherwise      → plannedTool = null
 */
export async function plannerNode(state: AgentState): Promise<AgentState> {
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
