import type { AgentState } from "../state/agentState";

/**
 * Tool Node
 *
 * Responsible for executing backend tools (search, cart, menu, etc.).
 * For now, it simply marks itself as visited in toolCalls.
 * Future: inspect planner's decision and invoke the appropriate tool,
 *         then store the result back into state.
 */
export async function toolNode(state: AgentState): Promise<AgentState> {
  return {
    ...state,
    toolCalls: [...state.toolCalls, "tool-node"],
  };
}
