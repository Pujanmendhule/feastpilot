import type { AgentState } from "../state/agentState";

/**
 * Response Node
 *
 * Produces the final response to send back to the client.
 *
 * Current behaviour:
 *  - If toolResult is present → "Tool executed successfully."
 *  - Otherwise → "LangGraph response pipeline active."
 *
 * Future: compose a natural-language reply from the tool results using an LLM.
 */
export async function responseNode(state: AgentState): Promise<AgentState> {
  const agentResponse =
    state.toolResult !== undefined
      ? "Tool executed successfully."
      : "LangGraph response pipeline active.";

  return {
    ...state,
    agentResponse,
    toolCalls: [...state.toolCalls, "response-node"],
  };
}
