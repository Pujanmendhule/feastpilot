import type { AgentState } from "../state/agentState";

/** Keywords that trigger a restaurant search */
const SEARCH_KEYWORDS = ["restaurant", "food", "biryani", "pizza", "burger"];

/** Keywords that trigger a menu fetch */
const MENU_KEYWORDS = ["menu", "show menu", "view menu"];

/**
 * Planner Node
 *
 * Analyses state.userMessage and sets plannedTool + any required context fields.
 *
 * Routing rules (keyword-based, no LLM):
 *  - Message contains a MENU_KEYWORD    → plannedTool = "getMenu",          restaurantId = "behrouz_biryani"
 *  - Message contains a SEARCH_KEYWORD  → plannedTool = "searchRestaurants", restaurantId unchanged
 *  - Otherwise                          → plannedTool = null
 *
 * Note: menu check runs before search so "show menu biryani" resolves to getMenu.
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
