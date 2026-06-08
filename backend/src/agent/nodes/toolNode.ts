import type { AgentState } from "../state/agentState";
import type { CartOperationResult } from "../types/toolResults";
import {
  searchRestaurants,
  getMenu,
  getCart,
  updateCart,
  removeFromCart,
  setCartItemQuantity,
} from "../tools";
import { sessionService } from "../../services/SessionService";
import { extractSearchQuery } from "../utils/queryExtractor";
import { matchMenuItem } from "../utils/menuItemMatcher";
import { resolveMenuCandidates } from "../utils/menuResolver";
import { ensureSessionCart } from "../utils/ensureSessionCart";

function buildCartError(
  action: CartOperationResult["action"],
  error: string
): CartOperationResult {
  return {
    success: false,
    action,
    data: null,
    error,
  };
}

async function resolveMenuItemForCart(
  state: AgentState
): Promise<
  | { ok: true; menuItemId: string; itemName: string }
  | { ok: false; result: CartOperationResult }
> {
  const action = state.cartAction ?? "add";

  if (!state.restaurantId || !state.menuItemQuery) {
    return {
      ok: false,
      result: buildCartError(action, "Menu item could not be determined."),
    };
  }

  const candidates = await resolveMenuCandidates(
    state.sessionId,
    state.restaurantId
  );
  const match = matchMenuItem(state.menuItemQuery, candidates);

  if (!match) {
    return {
      ok: false,
      result: buildCartError(
        action,
        `Could not find "${state.menuItemQuery}" on the menu. Try "show menu" first.`
      ),
    };
  }

  return {
    ok: true,
    menuItemId: match.id,
    itemName: match.name,
  };
}

/**
 * Tool Node
 *
 * Executes the tool chosen by the Planner Node.
 */
export async function toolNode(state: AgentState): Promise<AgentState> {

  // ── searchRestaurants ────────────────────────────────────────────────────
  if (state.plannedTool === "searchRestaurants") {
    const query = state.searchQuery ?? extractSearchQuery(state.userMessage);
    const toolResult = await searchRestaurants({ query });

    if (toolResult.success && toolResult.data.length > 0) {
      sessionService.setLastSearchResults(
        state.sessionId,
        toolResult.data.map((restaurant) => ({
          id: restaurant.id,
          name: restaurant.name,
        }))
      );
      sessionService.setAwaitingRestaurantSelection(state.sessionId, true);
    }

    return {
      ...state,
      searchQuery: query,
      toolResult,
      toolCalls: [...state.toolCalls, "searchRestaurants"],
    };
  }

  // ── selectRestaurant ─────────────────────────────────────────────────────
  if (state.plannedTool === "selectRestaurant") {
    const candidates = sessionService.getLastSearchResults(state.sessionId);
    const match = candidates.find(
      (candidate) => candidate.id === state.restaurantId
    );

    if (match) {
      sessionService.setSelectedRestaurant(state.sessionId, match.id);
      sessionService.setAwaitingRestaurantSelection(state.sessionId, false);

      return {
        ...state,
        toolResult: {
          success: true,
          data: { id: match.id, name: match.name },
        },
        toolCalls: [...state.toolCalls, "selectRestaurant"],
      };
    }

    return {
      ...state,
      toolResult: {
        success: false,
        data: null,
        error:
          "Could not match that to a restaurant. Please choose from the list.",
      },
      toolCalls: [...state.toolCalls, "selectRestaurant"],
    };
  }

  // ── getMenu ──────────────────────────────────────────────────────────────
  if (state.plannedTool === "getMenu" && state.restaurantId) {
    const toolResult = await getMenu({ restaurantId: state.restaurantId });

    if (toolResult.success && toolResult.data.length > 0) {
      sessionService.setLastViewedMenuItems(
        state.sessionId,
        toolResult.data.map((item) => ({
          id: item.id,
          name: item.name,
          restaurantId: state.restaurantId!,
        }))
      );
    }

    return {
      ...state,
      toolResult,
      toolCalls: [...state.toolCalls, "getMenu"],
    };
  }

  // ── getCart ──────────────────────────────────────────────────────────────
  if (state.plannedTool === "getCart") {
    const session = sessionService.getSession(state.sessionId);
    const cartId = session?.cartId ?? null;

    if (!cartId) {
      return {
        ...state,
        toolResult: buildCartError("view", "Your cart is empty."),
        toolCalls: [...state.toolCalls, "getCart"],
      };
    }

    const cartResult = await getCart({ cartId });
    if (!cartResult.success || !cartResult.data) {
      return {
        ...state,
        toolResult: buildCartError(
          "view",
          cartResult.error ?? "Failed to load cart"
        ),
        toolCalls: [...state.toolCalls, "getCart"],
      };
    }

    return {
      ...state,
      cartId,
      toolResult: {
        success: true,
        action: "view",
        data: cartResult.data,
      },
      toolCalls: [...state.toolCalls, "getCart"],
    };
  }

  // ── addToCart ────────────────────────────────────────────────────────────
  if ((state.plannedTool === "addToCart" || state.plannedTool === "updateCart") && state.restaurantId) {
    const action = state.cartAction === "addAnother" ? "addAnother" : "add";
    const resolved = await resolveMenuItemForCart(state);

    if (!resolved.ok) {
      return {
        ...state,
        toolResult: resolved.result,
        toolCalls: [...state.toolCalls, state.plannedTool!],
      };
    }

    const cartId = await ensureSessionCart(state.sessionId);
    const cartResult = await updateCart({
      cartId,
      restaurantId: state.restaurantId,
      menuItemId: resolved.menuItemId,
      quantity: state.quantity,
    });

    if (!cartResult.success || !cartResult.data) {
      return {
        ...state,
        toolResult: buildCartError(
          action,
          cartResult.error ?? "Failed to add item"
        ),
        toolCalls: [...state.toolCalls, state.plannedTool!],
      };
    }

    // Update conversational memory with the resolved item.
    sessionService.setLastReferencedItem(
      state.sessionId,
      resolved.menuItemId,
      resolved.itemName
    );

    return {
      ...state,
      cartId,
      menuItemId: resolved.menuItemId,
      resolvedMenuItemName: resolved.itemName,
      toolResult: {
        success: true,
        action,
        data: cartResult.data,
        itemName: resolved.itemName,
        quantity: state.quantity,
      },
      toolCalls: [...state.toolCalls, state.plannedTool!],
    };
  }

  // ── removeFromCart ───────────────────────────────────────────────────────
  if (state.plannedTool === "removeFromCart" && state.restaurantId) {
    const resolved = await resolveMenuItemForCart(state);

    if (!resolved.ok) {
      return {
        ...state,
        toolResult: resolved.result,
        toolCalls: [...state.toolCalls, "removeFromCart"],
      };
    }

    const session = sessionService.getSession(state.sessionId);
    const cartId = session?.cartId ?? null;

    if (!cartId) {
      return {
        ...state,
        toolResult: buildCartError("remove", "Your cart is empty."),
        toolCalls: [...state.toolCalls, "removeFromCart"],
      };
    }

    const cartResult = await removeFromCart({
      cartId,
      restaurantId: state.restaurantId,
      menuItemId: resolved.menuItemId,
    });

    if (!cartResult.success || !cartResult.data) {
      return {
        ...state,
        toolResult: buildCartError(
          "remove",
          cartResult.error ?? "Failed to remove item"
        ),
        toolCalls: [...state.toolCalls, "removeFromCart"],
      };
    }

    // Update conversational memory with the resolved item.
    const sess = sessionService.getSession(state.sessionId);
    if (sess) {
      const remainingItems = cartResult.data?.items ?? [];
      if (remainingItems.length > 0) {
        const lastItem = remainingItems[remainingItems.length - 1];
        const cachedItem = sess.lastViewedMenuItems.find(
          (i) => i.id === lastItem.menuItemId
        );
        const itemName = cachedItem?.name ?? lastItem.menuItemId;
        sess.lastReferencedMenuItemId = lastItem.menuItemId;
        sess.lastReferencedMenuItemName = itemName;
      } else {
        sess.lastReferencedMenuItemId = null;
        sess.lastReferencedMenuItemName = null;
      }
    }

    return {
      ...state,
      cartId,
      menuItemId: resolved.menuItemId,
      resolvedMenuItemName: resolved.itemName,
      toolResult: {
        success: true,
        action: "remove",
        data: cartResult.data,
        itemName: resolved.itemName,
      },
      toolCalls: [...state.toolCalls, "removeFromCart"],
    };
  }

  // ── setCartQuantity ──────────────────────────────────────────────────────
  if ((state.plannedTool === "setCartQuantity" || state.plannedTool === "setCartItemQuantity") && state.restaurantId) {
    const resolved = await resolveMenuItemForCart(state);

    if (!resolved.ok) {
      return {
        ...state,
        toolResult: resolved.result,
        toolCalls: [...state.toolCalls, state.plannedTool!],
      };
    }

    const session = sessionService.getSession(state.sessionId);
    const cartId = session?.cartId ?? null;

    if (!cartId) {
      return {
        ...state,
        toolResult: buildCartError(
          "setQuantity",
          `${resolved.itemName} is not in your cart.`
        ),
        toolCalls: [...state.toolCalls, state.plannedTool!],
      };
    }

    const cartResult = await setCartItemQuantity({
      cartId,
      restaurantId: state.restaurantId,
      menuItemId: resolved.menuItemId,
      quantity: state.quantity,
    });

    if (!cartResult.success || !cartResult.data) {
      return {
        ...state,
        toolResult: buildCartError(
          "setQuantity",
          cartResult.error ?? "Failed to update quantity"
        ),
        toolCalls: [...state.toolCalls, state.plannedTool!],
      };
    }

    // Update conversational memory with the resolved item.
    sessionService.setLastReferencedItem(
      state.sessionId,
      resolved.menuItemId,
      resolved.itemName
    );

    return {
      ...state,
      cartId,
      menuItemId: resolved.menuItemId,
      resolvedMenuItemName: resolved.itemName,
      toolResult: {
        success: true,
        action: "setQuantity",
        data: cartResult.data,
        itemName: resolved.itemName,
        quantity: state.quantity,
      },
      toolCalls: [...state.toolCalls, state.plannedTool!],
    };
  }

  // ── No tool planned ──────────────────────────────────────────────────────
  return {
    ...state,
    toolCalls: [...state.toolCalls, "tool-node"],
  };
}
