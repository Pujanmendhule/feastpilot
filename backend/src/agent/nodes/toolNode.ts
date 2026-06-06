import type { AgentState } from "../state/agentState";
import { searchRestaurants, getMenu, createCart, updateCart } from "../tools";
import { sessionService } from "../../services/SessionService";
import { extractSearchQuery } from "../utils/queryExtractor";

/**
 * Tool Node
 *
 * Executes the tool chosen by the Planner Node.
 *
 * Dispatch table:
 *  - "searchRestaurants" → calls searchRestaurants({ query: searchQuery })
 *  - "getMenu"           → calls getMenu({ restaurantId })
 *  - "updateCart"        → ensures cart exists, attaches to session, calls updateCart
 *  - anything else/null  → no-op, passes state through
 */
export async function toolNode(state: AgentState): Promise<AgentState> {

  // ── searchRestaurants ────────────────────────────────────────────────────
  if (state.plannedTool === "searchRestaurants") {
    const query = state.searchQuery ?? extractSearchQuery(state.userMessage);
    const toolResult = await searchRestaurants({ query });

    if (toolResult.success && toolResult.data.length > 0) {
      const restaurantId = toolResult.data[0].id;
      sessionService.setSelectedRestaurant(state.sessionId, restaurantId);
    }

    return {
      ...state,
      searchQuery: query,
      toolResult,
      toolCalls: [...state.toolCalls, "searchRestaurants"],
    };
  }

  // ── getMenu ──────────────────────────────────────────────────────────────
  if (state.plannedTool === "getMenu" && state.restaurantId) {
    const toolResult = await getMenu({ restaurantId: state.restaurantId });
    return {
      ...state,
      toolResult,
      toolCalls: [...state.toolCalls, "getMenu"],
    };
  }

  // ── updateCart ───────────────────────────────────────────────────────────
  if (
    state.plannedTool === "updateCart" &&
    state.restaurantId &&
    state.menuItemId
  ) {
    // 1. Load session and determine active cartId
    const session = sessionService.getSession(state.sessionId);
    let cartId = session?.cartId ?? null;

    // 2. Create a new cart if none is attached to the session
    if (!cartId) {
      const created = await createCart();
      cartId = created.data.id;
      // Attach newly created cart to the session
      if (session) {
        sessionService.attachCartToSession(state.sessionId, cartId);
      }
    }

    // 3. Add the item to the cart
    const toolResult = await updateCart({
      cartId,
      restaurantId: state.restaurantId,
      menuItemId: state.menuItemId,
      quantity: state.quantity,
    });

    return {
      ...state,
      cartId,
      toolResult,
      toolCalls: [...state.toolCalls, "updateCart"],
    };
  }

  // ── No tool planned ──────────────────────────────────────────────────────
  return {
    ...state,
    toolCalls: [...state.toolCalls, "tool-node"],
  };
}
