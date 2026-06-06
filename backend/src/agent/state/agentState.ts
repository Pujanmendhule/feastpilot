import { DEFAULT_QUANTITY } from "../constants";
import type { CartAction } from "../types/toolResults";

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
  /** Restaurant ID used for getMenu / updateCart */
  restaurantId: string | null;
  /** Menu item ID to add to cart */
  menuItemId: string | null;
  /** Quantity of the menu item to add */
  quantity: number;
  /** Extracted search terms when plannedTool is searchRestaurants */
  searchQuery: string | null;
  /** Cart operation type when a cart tool is planned */
  cartAction: CartAction | null;
  /** Natural-language menu item query for cart operations */
  menuItemQuery: string | null;
  /** Resolved menu item display name for responses */
  resolvedMenuItemName: string | null;
}

/**
 * Initialise a fresh {@link AgentState} for a new conversation turn.
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
    restaurantId: null,
    menuItemId: null,
    quantity: DEFAULT_QUANTITY,
    searchQuery: null,
    cartAction: null,
    menuItemQuery: null,
    resolvedMenuItemName: null,
  };
}
