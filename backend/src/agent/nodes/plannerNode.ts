import type { AgentState } from "../state/agentState";

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
 *  1. MENU keywords  → plannedTool = "getMenu",          restaurantId = "behrouz_biryani"
 *  2. CART keywords  → plannedTool = "updateCart",       restaurantId = "behrouz_biryani", menuItemId = "bb_3", quantity = 1
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
      restaurantId: "behrouz_biryani",
      toolCalls: [...state.toolCalls, "planner"],
    };
  }

  if (CART_KEYWORDS.some((kw) => lowerMessage.includes(kw))) {
    return {
      ...state,
      plannedTool: "updateCart",
      restaurantId: "behrouz_biryani",
      menuItemId: "bb_3",
      quantity: 1,
      toolCalls: [...state.toolCalls, "planner"],
    };
  }

  if (SEARCH_KEYWORDS.some((kw) => lowerMessage.includes(kw))) {
    return {
      ...state,
      plannedTool: "searchRestaurants",
      toolCalls: [...state.toolCalls, "planner"],
    };
  }

  return {
    ...state,
    plannedTool: null,
    toolCalls: [...state.toolCalls, "planner"],
  };
}
