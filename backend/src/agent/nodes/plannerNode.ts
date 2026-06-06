import type { AgentState } from "../state/agentState";
import { DEFAULT_RESTAURANT_ID } from "../constants";
import { extractSearchQuery } from "../utils/queryExtractor";
import { matchRestaurantSelection } from "../utils/restaurantMatcher";
import { parseCartIntent } from "../utils/cartIntentParser";
import { sessionService } from "../../services/SessionService";
import { modelService } from "../../services/models/ModelService";

/** Keywords that trigger a restaurant search */
const SEARCH_KEYWORDS = ["restaurant", "food", "biryani", "pizza", "burger"];

/** Keywords that trigger a menu fetch */
const MENU_KEYWORDS = ["menu", "show menu", "view menu"];

function resolveRestaurantId(sessionId: string): string {
  const selectedRestaurantId = sessionService.getSession(sessionId)
    ?.selectedRestaurantId;
  return selectedRestaurantId ?? DEFAULT_RESTAURANT_ID;
}

/**
 * Fallback Keyword Planner
 *
 * Analyses state.userMessage using legacy keyword routing rules.
 */
function fallbackKeywordPlanner(state: AgentState): AgentState {
  const lowerMessage = state.userMessage.toLowerCase();

  if (sessionService.isAwaitingRestaurantSelection(state.sessionId)) {
    const candidates = sessionService.getLastSearchResults(state.sessionId);
    const match = matchRestaurantSelection(state.userMessage, candidates);

    return {
      ...state,
      plannedTool: "selectRestaurant",
      restaurantId: match?.id ?? null,
      toolCalls: [...state.toolCalls, "planner"],
    };
  }

  if (MENU_KEYWORDS.some((kw) => lowerMessage.includes(kw))) {
    return {
      ...state,
      plannedTool: "getMenu",
      restaurantId: resolveRestaurantId(state.sessionId),
      toolCalls: [...state.toolCalls, "planner"],
    };
  }

  const cartIntent = parseCartIntent(state.userMessage);
  if (cartIntent) {
    const restaurantId = resolveRestaurantId(state.sessionId);

    if (cartIntent.type === "view") {
      return {
        ...state,
        plannedTool: "getCart",
        restaurantId,
        cartAction: "view",
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    if (cartIntent.type === "remove") {
      return {
        ...state,
        plannedTool: "removeFromCart",
        restaurantId,
        cartAction: "remove",
        menuItemQuery: cartIntent.itemQuery,
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    if (cartIntent.type === "setQuantity") {
      return {
        ...state,
        plannedTool: "setCartQuantity",
        restaurantId,
        cartAction: "setQuantity",
        menuItemQuery: cartIntent.itemQuery,
        quantity: cartIntent.quantity,
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    return {
      ...state,
      plannedTool: "addToCart",
      restaurantId,
      cartAction: cartIntent.type,
      menuItemQuery: cartIntent.itemQuery,
      quantity: cartIntent.quantity,
      toolCalls: [...state.toolCalls, "planner"],
    };
  }

  if (SEARCH_KEYWORDS.some((kw) => lowerMessage.includes(kw))) {
    return {
      ...state,
      plannedTool: "searchRestaurants",
      searchQuery: extractSearchQuery(state.userMessage),
      toolCalls: [...state.toolCalls, "planner"],
    };
  }

  return {
    ...state,
    plannedTool: null,
    toolCalls: [...state.toolCalls, "planner"],
  };
}

/**
 * Planner Node
 *
 * Classifies userMessage using ModelService, extracting entities and routing to tools.
 * Falls back to keyword planner rules on error or unknown intent.
 */
export async function plannerNode(state: AgentState): Promise<AgentState> {
  // If awaiting restaurant selection, this state-based routing takes precedence.
  if (sessionService.isAwaitingRestaurantSelection(state.sessionId)) {
    const candidates = sessionService.getLastSearchResults(state.sessionId);
    const match = matchRestaurantSelection(state.userMessage, candidates);

    return {
      ...state,
      plannedTool: "selectRestaurant",
      restaurantId: match?.id ?? null,
      toolCalls: [...state.toolCalls, "planner"],
    };
  }

  try {
    const intentResult = await modelService.classifyIntent(state.userMessage);

    // Observability Logging
    console.log(`Intent: ${intentResult.intent}`);
    console.log(`Provider: ${modelService.getProviderType()}`);
    console.log(`Confidence: ${intentResult.confidence}`);

    if (!intentResult || intentResult.intent === "unknown") {
      return fallbackKeywordPlanner(state);
    }

    const entities = await modelService.extractEntities(
      state.userMessage,
      intentResult.intent
    );

    const restaurantId = resolveRestaurantId(state.sessionId);

    switch (intentResult.intent) {
      case "show_menu":
        return {
          ...state,
          plannedTool: "getMenu",
          restaurantId,
          toolCalls: [...state.toolCalls, "planner"],
        };

      case "search_restaurants":
        return {
          ...state,
          plannedTool: "searchRestaurants",
          searchQuery: entities.searchQuery ?? null,
          toolCalls: [...state.toolCalls, "planner"],
        };

      case "add_to_cart":
        return {
          ...state,
          plannedTool: "updateCart",
          restaurantId,
          cartAction: "add",
          menuItemQuery: entities.item ?? null,
          quantity: entities.quantity ?? state.quantity,
          toolCalls: [...state.toolCalls, "planner"],
        };

      case "add_another":
        return {
          ...state,
          plannedTool: "updateCart",
          restaurantId,
          cartAction: "addAnother",
          menuItemQuery: entities.item ?? null,
          quantity: entities.quantity ?? state.quantity,
          toolCalls: [...state.toolCalls, "planner"],
        };

      case "remove_item":
        return {
          ...state,
          plannedTool: "removeFromCart",
          restaurantId,
          cartAction: "remove",
          menuItemQuery: entities.item ?? null,
          toolCalls: [...state.toolCalls, "planner"],
        };

      case "view_cart":
        return {
          ...state,
          plannedTool: "getCart",
          restaurantId,
          cartAction: "view",
          toolCalls: [...state.toolCalls, "planner"],
        };

      case "set_quantity":
        return {
          ...state,
          plannedTool: "setCartItemQuantity",
          restaurantId,
          cartAction: "setQuantity",
          menuItemQuery: entities.item ?? null,
          quantity: entities.quantity ?? state.quantity,
          toolCalls: [...state.toolCalls, "planner"],
        };

      case "select_restaurant":
        return {
          ...state,
          plannedTool: "selectRestaurant",
          restaurantId: entities.restaurant ?? null,
          toolCalls: [...state.toolCalls, "planner"],
        };

      default:
        return fallbackKeywordPlanner(state);
    }
  } catch (error) {
    console.warn("ModelService intent classification failed, falling back to keywords:", error);
    return fallbackKeywordPlanner(state);
  }
}

