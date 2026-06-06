import type { AgentState } from "../state/agentState";
import {
  DEFAULT_RESTAURANT_ID,
  DEFAULT_MENU_ITEM_ID,
  DEFAULT_QUANTITY,
} from "../constants";
import { extractSearchQuery } from "../utils/queryExtractor";

/** Keywords that trigger a restaurant search */
const SEARCH_KEYWORDS = ["restaurant", "food", "biryani", "pizza", "burger"];

/** Keywords that trigger a menu fetch */
const MENU_KEYWORDS = ["menu", "show menu", "view menu"];

/** Keywords that trigger adding an item to the cart */
const CART_KEYWORDS = ["add", "order", "cart"];

/**
 * Planner Node
 *
 * Analyses state.userMessage and sets plannedTool + required context fields.
 *
 * Routing rules (priority order, keyword-based, no LLM):
 *  1. MENU keywords  → plannedTool = "getMenu",          restaurantId = DEFAULT_RESTAURANT_ID
 *  2. CART keywords  → plannedTool = "updateCart",       restaurantId = DEFAULT_RESTAURANT_ID, menuItemId = DEFAULT_MENU_ITEM_ID, quantity = DEFAULT_QUANTITY
 *  3. SEARCH keywords→ plannedTool = "searchRestaurants"
 *  4. Otherwise      → plannedTool = null
 *
 * Future: replace keyword matching with an LLM-based intent classifier.
 */
export async function plannerNode(state: AgentState): Promise<AgentState> {
  const lowerMessage = state.userMessage.toLowerCase();

  if (MENU_KEYWORDS.some((kw) => lowerMessage.includes(kw))) {
    return {
      ...state,
      plannedTool: "getMenu",
      restaurantId: DEFAULT_RESTAURANT_ID,
      toolCalls: [...state.toolCalls, "planner"],
    };
  }

  if (CART_KEYWORDS.some((kw) => lowerMessage.includes(kw))) {
    return {
      ...state,
      plannedTool: "updateCart",
      restaurantId: DEFAULT_RESTAURANT_ID,
      menuItemId: DEFAULT_MENU_ITEM_ID,
      quantity: DEFAULT_QUANTITY,
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
