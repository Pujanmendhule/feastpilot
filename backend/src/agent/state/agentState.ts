// LangGraph state definition (type-only, no runtime logic)

/**
 * Shared state passed between future LangGraph nodes.
 * It captures the conversation context, tool usage, and cart association.
 */
export interface AgentState {
  /** Identifier of the session this state belongs to */
  sessionId: string;
  /** Message received from the user */
  userMessage: string;
  /** Final response produced by the agent */
  agentResponse: string;
  /** Currently active cart, if any */
  cartId: string | null;
  /** List of tool identifiers that have been invoked */
  toolCalls: string[];
  /** Tool chosen by the planner node; null means no tool needed */
  plannedTool: string | null;
  /** Raw result returned by the executed tool, if any */
  toolResult: unknown;
}

/**
 * Initialise a fresh {@link AgentState} for a new conversation turn.
 *
 * @param sessionId - The session to which this state belongs.
 * @param userMessage - The incoming user message.
 * @returns An {@link AgentState} with empty/initial values.
 */
export function createInitialState(
  sessionId: string,
  userMessage: string,
): AgentState {
  return {
    sessionId,
    userMessage,
    agentResponse: "",
    cartId: null,
    toolCalls: [],
    plannedTool: null,
    toolResult: undefined,
  };
}
