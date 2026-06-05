import type { AgentState } from "../state/agentState";

/**
 * Response Node
 *
 * Produces the final response that will be sent back to the client.
 * For now, it sets a static confirmation message.
 * Future: compose a natural-language reply from tool results stored in state.
 */
export async function responseNode(state: AgentState): Promise<AgentState> {
  return {
    ...state,
    agentResponse: "LangGraph response pipeline active.",
    toolCalls: [...state.toolCalls, "response-node"],
  };
}
