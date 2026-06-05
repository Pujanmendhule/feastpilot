import type { AgentState } from "../state/agentState";

/** Keywords that indicate the user wants to search for food / restaurants */
const SEARCH_KEYWORDS = ["restaurant", "food", "biryani", "pizza", "burger"];

/**
 * Planner Node
 *
 * Reads `state.userMessage` and decides which tool should run next.
 * Sets `state.plannedTool` accordingly.
 *
 * Current routing rules (keyword-based, no LLM):
 *  - Message contains any SEARCH_KEYWORD → "searchRestaurants"
 *  - Otherwise → null (no tool needed)
 *
 * Future: replace keyword matching with an LLM-based intent classifier.
 */
export async function plannerNode(state: AgentState): Promise<AgentState> {
  const lowerMessage = state.userMessage.toLowerCase();

  const plannedTool = SEARCH_KEYWORDS.some((kw) => lowerMessage.includes(kw))
    ? "searchRestaurants"
    : null;

  return {
    ...state,
    plannedTool,
    toolCalls: [...state.toolCalls, "planner"],
  };
}
