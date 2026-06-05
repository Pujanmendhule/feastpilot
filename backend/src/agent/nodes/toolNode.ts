import type { AgentState } from "../state/agentState";
import { searchRestaurants, getMenu } from "../tools";

/**
 * Tool Node
 *
 * Executes the tool chosen by the Planner Node.
 *
 * Dispatch table:
 *  - "searchRestaurants" → calls searchRestaurants({ query: userMessage })
 *  - "getMenu"           → calls getMenu({ restaurantId: state.restaurantId })
 *  - anything else / null → no-op, passes state through
 */
export async function toolNode(state: AgentState): Promise<AgentState> {
  if (state.plannedTool === "searchRestaurants") {
    const toolResult = await searchRestaurants({ query: state.userMessage });
    return {
      ...state,
      toolResult,
      toolCalls: [...state.toolCalls, "searchRestaurants"],
    };
  }

  if (state.plannedTool === "getMenu" && state.restaurantId) {
    const toolResult = await getMenu({ restaurantId: state.restaurantId });
    return {
      ...state,
      toolResult,
      toolCalls: [...state.toolCalls, "getMenu"],
    };
  }

  // No tool planned — pass state through unchanged
  return {
    ...state,
    toolCalls: [...state.toolCalls, "tool-node"],
  };
}
