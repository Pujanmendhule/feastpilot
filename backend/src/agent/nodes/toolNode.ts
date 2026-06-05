import type { AgentState } from "../state/agentState";
import { searchRestaurants } from "../tools";

/**
 * Tool Node
 *
 * Executes the tool chosen by the Planner Node.
 *
 * Current behaviour:
 *  - plannedTool === "searchRestaurants" → calls searchRestaurants with userMessage as query
 *  - anything else → no-op, state is passed through unchanged
 *
 * Future: dispatch to any tool in the registry based on plannedTool value.
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

  // No tool planned — pass state through unchanged (still mark node as visited)
  return {
    ...state,
    toolCalls: [...state.toolCalls, "tool-node"],
  };
}
