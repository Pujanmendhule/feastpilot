import type { AgentState } from "../state/agentState";

/**
 * Planner Node
 *
 * Reads the user message and decides what should happen next.
 * For now, it simply marks itself as visited in toolCalls.
 * Future: analyse userMessage and determine which tools to invoke.
 */
export async function plannerNode(state: AgentState): Promise<AgentState> {
  return {
    ...state,
    toolCalls: [...state.toolCalls, "planner"],
  };
}
