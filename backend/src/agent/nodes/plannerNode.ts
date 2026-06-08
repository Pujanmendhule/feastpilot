import type { AgentState } from "../state/agentState";
import { DEFAULT_QUANTITY, DEFAULT_RESTAURANT_ID } from "../constants";
import { extractSearchQuery } from "../utils/queryExtractor";
import { matchRestaurantSelection } from "../utils/restaurantMatcher";
import { parseCartIntent } from "../utils/cartIntentParser";
import { resolveReference, extractAbsoluteQuantity, isIncrementalAdd } from "../utils/referenceResolver";
import { sessionService } from "../../services/SessionService";
import { modelService } from "../../services/models/ModelService";
import type { EntityExtractionResult, IntentResult } from "../../services/models/types";

/** Minimum confidence for the Azure result to be used as primary source. */
const CONFIDENCE_THRESHOLD = 0.6;

/** Keywords that trigger a restaurant search */
const SEARCH_KEYWORDS = ["restaurant", "food", "biryani", "pizza", "burger"];

/** Keywords that trigger a menu fetch */
const MENU_KEYWORDS = ["menu", "show menu", "view menu"];

/**
 * Words that Azure entity extraction may return as `item` when the user
 * is using a conversational reference rather than naming an actual dish.
 * When `entities.item` is one of these, treat it as missing.
 */
const REFERENCE_ENTITY_WORDS = new Set([
  "it", "that", "same", "same item", "another", "one more",
  "this", "the same",
]);

function stripReferenceEntity(item: string | undefined): string | undefined {
  if (!item) return item;
  return REFERENCE_ENTITY_WORDS.has(item.toLowerCase().trim()) ? undefined : item;
}

/**
 * Attempt to fill an empty menuItemQuery from session memory.
 * Returns the remembered item name or the original query.
 */
async function resolveMenuItemFromMemory(
  menuItemQuery: string | null,
  sessionId: string
): Promise<string | null> {
  if (menuItemQuery) return menuItemQuery;
  const session = await sessionService.getSession(sessionId);
  if (!session) return null;
  const ref = resolveReference("", session);
  // We pass "" here because by this point we already know
  // the intent involves a reference — the caller checks the
  // user message for reference keywords.
  return ref?.itemName ?? null;
}

async function resolveRestaurantId(sessionId: string): Promise<string> {
  const session = await sessionService.getSession(sessionId);
  const selectedRestaurantId = session?.selectedRestaurantId;
  return selectedRestaurantId ?? DEFAULT_RESTAURANT_ID;
}

/**
 * Log planner decision with intent, confidence, extracted entities, and source.
 * Only called when ModelService succeeds.
 */
function logPlannerDecision(
  intent: IntentResult,
  entities: EntityExtractionResult
): void {
  console.log(`[Planner] Provider  : ${modelService.getProviderType()}`);
  console.log(`[Planner] Source    : azure`);
  console.log(`[Planner] Intent    : ${intent.intent}`);
  console.log(`[Planner] Confidence: ${intent.confidence.toFixed(2)}`);
  console.log(
    `[Planner] Entities  : item="${entities.item ?? "—"}" ` +
    `quantity=${entities.quantity ?? "—"} ` +
    `restaurant="${entities.restaurant ?? "—"}" ` +
    `searchQuery="${entities.searchQuery ?? "—"}"`
  );
}

/**
 * Fallback Keyword Planner
 *
 * Analyses state.userMessage using legacy keyword routing rules.
 * Used when:
 *   - ModelService throws an error
 *   - Confidence is below CONFIDENCE_THRESHOLD
 *   - Intent is "unknown" and no entity was extracted
 */
async function fallbackKeywordPlanner(state: AgentState): Promise<AgentState> {
  const lowerMessage = state.userMessage.toLowerCase();

  if (await sessionService.isAwaitingRestaurantSelection(state.sessionId)) {
    const candidates = await sessionService.getLastSearchResults(state.sessionId);
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
      restaurantId: await resolveRestaurantId(state.sessionId),
      toolCalls: [...state.toolCalls, "planner"],
    };
  }

  const cartIntent = parseCartIntent(state.userMessage);
  if (cartIntent) {
    const restaurantId = await resolveRestaurantId(state.sessionId);

    // ── Reference resolution for fallback planner ──
    // If the cart parser returned an empty itemQuery, try to fill it
    // from session memory (e.g. "remove it", "add one more").
    const session = await sessionService.getSession(state.sessionId);
    let resolvedItemQuery = cartIntent.type !== "view" ? (cartIntent as { itemQuery: string }).itemQuery : null;
    if (session && resolvedItemQuery === "") {
      const ref = resolveReference(state.userMessage, session);
      resolvedItemQuery = ref?.itemName ?? null;
    }

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
        menuItemQuery: resolvedItemQuery,
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    if (cartIntent.type === "setQuantity") {
      return {
        ...state,
        plannedTool: "setCartQuantity",
        restaurantId,
        cartAction: "setQuantity",
        menuItemQuery: resolvedItemQuery,
        quantity: cartIntent.quantity,
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    return {
      ...state,
      plannedTool: "addToCart",
      restaurantId,
      cartAction: cartIntent.type,
      menuItemQuery: resolvedItemQuery,
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
 * Primary path:
 *   1. Call ModelService.classifyIntent() — uses the configured provider (Azure, mock, …)
 *   2. If confidence >= CONFIDENCE_THRESHOLD, call extractEntities()
 *   3. Populate AgentState directly from extracted entities
 *   4. Map intent → plannedTool
 *
 * Fallback conditions (legacy keyword planner):
 *   - ModelService throws (network error, misconfiguration, …)
 *   - intent === "unknown"
 *   - confidence < CONFIDENCE_THRESHOLD
 *   - Required entities are missing AND legacy parser can fill them
 */
export async function plannerNode(state: AgentState): Promise<AgentState> {
  // Restaurant-selection state takes absolute precedence regardless of provider.
  if (await sessionService.isAwaitingRestaurantSelection(state.sessionId)) {
    const candidates = await sessionService.getLastSearchResults(state.sessionId);
    const match = matchRestaurantSelection(state.userMessage, candidates);

    return {
      ...state,
      plannedTool: "selectRestaurant",
      restaurantId: match?.id ?? null,
      toolCalls: [...state.toolCalls, "planner"],
    };
  }

  // ── ModelService (primary) ─────────────────────────────────────────────────
  let intentResult: IntentResult;
  try {
    intentResult = await modelService.classifyIntent(state.userMessage);
  } catch (error) {
    console.warn(
      `[Planner] Source    : legacy-fallback (classifyIntent failed — ${modelService.getProviderType()})`,
      error
    );
    return await fallbackKeywordPlanner(state);
  }

  // Fall back if intent is unknown or confidence is too low.
  if (
    intentResult.intent === "unknown" ||
    intentResult.confidence < CONFIDENCE_THRESHOLD
  ) {
    console.log(
      `[Planner] Source    : legacy-fallback ` +
      `(intent=${intentResult.intent}, confidence=${intentResult.confidence.toFixed(2)} < ${CONFIDENCE_THRESHOLD})`
    );
    return await fallbackKeywordPlanner(state);
  }

  // ── Entity extraction ──────────────────────────────────────────────────────
  let entities: EntityExtractionResult;
  try {
    entities = await modelService.extractEntities(
      state.userMessage,
      intentResult.intent
    );
  } catch (error) {
    console.warn(
      `[Planner] extractEntities failed, proceeding without entities:`,
      error
    );
    entities = { entities: {} };
  }

  logPlannerDecision(intentResult, entities);

  // ── Shared state enrichment from model ────────────────────────────────────
  // These fields are available to responseNode and future graph nodes.
  const modelState = {
    intent: intentResult.intent,
    intentConfidence: intentResult.confidence,
  };

  const restaurantId = await resolveRestaurantId(state.sessionId);

  // ── Intent → Tool mapping ──────────────────────────────────────────────────
  switch (intentResult.intent) {

    // ── show_menu ─────────────────────────────────────────────────────────────
    case "show_menu":
      return {
        ...state,
        ...modelState,
        plannedTool: "getMenu",
        restaurantId,
        toolCalls: [...state.toolCalls, "planner"],
      };

    // ── search_restaurants ────────────────────────────────────────────────────
    case "search_restaurants": {
      // Primary: Azure entity. Fallback: legacy extractor.
      const searchQuery =
        entities.searchQuery ?? extractSearchQuery(state.userMessage);
      return {
        ...state,
        ...modelState,
        plannedTool: "searchRestaurants",
        searchQuery,
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    // ── select_restaurant ─────────────────────────────────────────────────────
    case "select_restaurant": {
      // Match the extracted restaurant name against the session candidate list.
      const candidates = await sessionService.getLastSearchResults(state.sessionId);
      const nameHint = entities.restaurant ?? state.userMessage;
      const match = matchRestaurantSelection(nameHint, candidates);
      return {
        ...state,
        ...modelState,
        plannedTool: "selectRestaurant",
        restaurantId: match?.id ?? null,
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    // ── add_to_cart ───────────────────────────────────────────────────────────
    case "add_to_cart": {
      const strippedItem = stripReferenceEntity(entities.item);
      // Primary entities from Azure; fall back to legacy cart parser for item/qty.
      const cartIntent = !strippedItem ? parseCartIntent(state.userMessage) : null;
      // Narrow away variants that lack itemQuery ('view') or quantity ('view'/'remove').
      const addCartFallback =
        cartIntent && cartIntent.type !== "view" && cartIntent.type !== "remove"
          ? cartIntent
          : null;
      let menuItemQuery = strippedItem ?? addCartFallback?.itemQuery ?? null;

      // Reference resolution: fill empty menuItemQuery from memory.
      const addSession = await sessionService.getSession(state.sessionId);
      if ((!menuItemQuery || menuItemQuery === "") && addSession) {
        const ref = resolveReference(state.userMessage, addSession);
        if (ref) menuItemQuery = ref.itemName;
      }

      const quantity =
        entities.quantity ??
        addCartFallback?.quantity ??
        state.quantity ??
        DEFAULT_QUANTITY;

      return {
        ...state,
        ...modelState,
        plannedTool: "updateCart",
        restaurantId,
        cartAction: "add",
        menuItemQuery,
        quantity,
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    // ── add_another ───────────────────────────────────────────────────────────
    case "add_another": {
      const strippedItem = stripReferenceEntity(entities.item);
      const cartIntent = !strippedItem ? parseCartIntent(state.userMessage) : null;
      const addAnotherFallback =
        cartIntent && cartIntent.type !== "view" && cartIntent.type !== "remove"
          ? cartIntent
          : null;
      let menuItemQuery = strippedItem ?? addAnotherFallback?.itemQuery ?? null;

      // Reference resolution: fill empty menuItemQuery from memory.
      const anotherSession = await sessionService.getSession(state.sessionId);
      if ((!menuItemQuery || menuItemQuery === "") && anotherSession) {
        const ref = resolveReference(state.userMessage, anotherSession);
        if (ref) menuItemQuery = ref.itemName;
      }

      const quantity =
        entities.quantity ??
        addAnotherFallback?.quantity ??
        state.quantity ??
        DEFAULT_QUANTITY;

      return {
        ...state,
        ...modelState,
        plannedTool: "updateCart",
        restaurantId,
        cartAction: "addAnother",
        menuItemQuery,
        quantity,
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    // ── remove_item ───────────────────────────────────────────────────────────
    case "remove_item": {
      const strippedItem = stripReferenceEntity(entities.item);
      const cartIntent = !strippedItem ? parseCartIntent(state.userMessage) : null;
      const removeFallback = cartIntent?.type !== "view" ? cartIntent : null;
      let menuItemQuery = strippedItem ?? removeFallback?.itemQuery ?? null;

      // Reference resolution: fill empty menuItemQuery from memory.
      const removeSession = await sessionService.getSession(state.sessionId);
      if ((!menuItemQuery || menuItemQuery === "") && removeSession) {
        const ref = resolveReference(state.userMessage, removeSession);
        if (ref) menuItemQuery = ref.itemName;
      }

      return {
        ...state,
        ...modelState,
        plannedTool: "removeFromCart",
        restaurantId,
        cartAction: "remove",
        menuItemQuery,
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    // ── view_cart ─────────────────────────────────────────────────────────────
    case "view_cart":
      return {
        ...state,
        ...modelState,
        plannedTool: "getCart",
        restaurantId,
        cartAction: "view",
        toolCalls: [...state.toolCalls, "planner"],
      };

    // ── set_quantity ──────────────────────────────────────────────────────────
    case "set_quantity": {
      const strippedItem = stripReferenceEntity(entities.item);
      const cartIntent = !strippedItem ? parseCartIntent(state.userMessage) : null;
      const setQtyFallback =
        cartIntent && cartIntent.type !== "view" && cartIntent.type !== "remove"
          ? cartIntent
          : null;
      let menuItemQuery = strippedItem ?? setQtyFallback?.itemQuery ?? null;

      // Reference resolution: fill empty menuItemQuery from memory.
      const setQtySession = await sessionService.getSession(state.sessionId);
      if ((!menuItemQuery || menuItemQuery === "") && setQtySession) {
        const ref = resolveReference(state.userMessage, setQtySession);
        if (ref) menuItemQuery = ref.itemName;
      }

      // Quantity: prefer Azure entity, then cart parser, then absolute quantity
      // from "make it N" pattern, then default.
      const absQty = extractAbsoluteQuantity(state.userMessage);
      const quantity =
        entities.quantity ??
        setQtyFallback?.quantity ??
        absQty ??
        state.quantity ??
        DEFAULT_QUANTITY;

      return {
        ...state,
        ...modelState,
        plannedTool: "setCartItemQuantity",
        restaurantId,
        cartAction: "setQuantity",
        menuItemQuery,
        quantity,
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    // ── unknown / unhandled ───────────────────────────────────────────────────
    default:
      console.log(`[Planner] Unhandled intent "${intentResult.intent}", using keyword fallback.`);
      return await fallbackKeywordPlanner(state);
  }
}
