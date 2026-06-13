import type { AgentState } from "../state/agentState";
import { DEFAULT_QUANTITY, DEFAULT_RESTAURANT_ID } from "../constants";
import { extractSearchQuery } from "../utils/queryExtractor";
import { matchRestaurantSelection } from "../utils/restaurantMatcher";
import { parseCartIntent } from "../utils/cartIntentParser";
import { resolveReference, extractAbsoluteQuantity, isIncrementalAdd } from "../utils/referenceResolver";
import { sessionService } from "../../services/SessionService";
import { modelService } from "../../services/models/ModelService";
import type { EntityExtractionResult, IntentResult } from "../../services/models/types";
import { detectRecommendation } from "../utils/recommendationDetector";
import { detectRefinement, isVagueRecommendation, clarifyAnswerToType } from "../utils/refinementDetector";
import { getRecommendationGoal, setRecommendationGoal, clearRecommendationGoal } from "../utils/recommendationGoalStore";
import { emptyConstraints } from "../types/recommendationGoal";
import type { ActiveRecommendationGoal, RecommendationConstraints } from "../types/recommendationGoal";

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

  // ── STEP 1: Active recommendation goal — check for refinement or clarification answer ──
  //
  // If the session has an active recommendation goal, check whether the current
  // message is a refinement ("not biryani", "cheaper") or clarification answer
  // ("vegetarian") BEFORE doing normal recommendation or intent detection.
  const activeGoal = await getRecommendationGoal(state.sessionId);

  if (activeGoal) {
    const refinement = detectRefinement(state.userMessage);

    if (refinement) {
      console.log(`[Planner] Refinement detected: type=${refinement.type} (goal=${activeGoal.type})`);

      // Clone constraints so we can mutate
      const c: RecommendationConstraints = {
        ...activeGoal.constraints,
        excludedCategories: [...activeGoal.constraints.excludedCategories],
        excludedNameKeywords: [...activeGoal.constraints.excludedNameKeywords],
        excludedItemIds: [...activeGoal.constraints.excludedItemIds],
      };

      let goalType = activeGoal.type;

      switch (refinement.type) {
        case "cheaper":
          // Reduce maxPrice by ~20% or set a ₹300 ceiling if no current max
          c.maxPrice = c.maxPrice !== undefined
            ? Math.floor(c.maxPrice * 0.8)
            : 300;
          break;

        case "more_expensive":
          // Raise minPrice by ~20% of current max or set ₹400 floor
          c.minPrice = c.maxPrice !== undefined
            ? Math.floor(c.maxPrice * 0.8)
            : 400;
          c.maxPrice = undefined;
          break;

        case "budget_update":
          c.maxPrice = refinement.budgetAmount;
          goalType = "budget";
          break;

        case "vegetarian":
          c.mustBeVegetarian = true;
          c.mustBeNonVegetarian = false;
          break;

        case "non_vegetarian":
          c.mustBeNonVegetarian = true;
          c.mustBeVegetarian = false;
          break;

        case "spicier":
          c.preferSpicy = true;
          goalType = "spicy";
          break;

        case "less_spicy":
          c.preferSpicy = false;
          // Exclude known spicy categories
          if (!c.excludedCategories.includes("starter")) c.excludedCategories.push("starter");
          break;

        case "healthier":
          c.preferHealthy = true;
          // Exclude heavy categories
          if (!c.excludedCategories.includes("burger")) c.excludedCategories.push("burger");
          if (!c.excludedCategories.includes("chicken")) c.excludedCategories.push("chicken");
          break;

        case "exclude_item": {
          // Add the keyword to both name and category exclusions
          const kw = refinement.excludeKeyword ?? "";
          if (kw && !c.excludedNameKeywords.includes(kw)) {
            c.excludedNameKeywords.push(kw);
          }
          if (kw && !c.excludedCategories.includes(kw)) {
            c.excludedCategories.push(kw);
          }
          break;
        }

        case "exclude_category": {
          const kw = refinement.excludeKeyword ?? "";
          if (kw && !c.excludedCategories.includes(kw)) {
            c.excludedCategories.push(kw);
          }
          break;
        }

        case "different":
          // Just keep excluded IDs to avoid repeating the same item
          // No other constraint change needed
          break;

        case "clarify_vegetarian":
          goalType = clarifyAnswerToType(refinement.type, activeGoal.type);
          c.mustBeVegetarian = true;
          c.mustBeNonVegetarian = false;
          break;

        case "clarify_non_vegetarian":
          goalType = clarifyAnswerToType(refinement.type, activeGoal.type);
          c.mustBeVegetarian = false;
          c.mustBeNonVegetarian = true;
          break;

        case "clarify_any":
          // No constraint change — just run the original goal
          break;
      }

      // Update and persist the refined goal
      const updatedGoal: ActiveRecommendationGoal = {
        ...activeGoal,
        type: goalType,
        constraints: c,
        awaitingClarification: false,
      };
      await setRecommendationGoal(state.sessionId, updatedGoal);

      return {
        ...state,
        plannedTool: "recommend",
        recommendationType: goalType,
        // searchQuery carries pairing reference, quantity carries budget
        searchQuery: activeGoal.pairingReference ?? state.searchQuery,
        quantity: c.maxPrice ?? state.quantity,
        toolCalls: [...state.toolCalls, "planner"],
      };
    }

    // Active goal but NOT a refinement — could be a new ordering intent.
    // Fall through to normal processing (model service will handle it).
  }

  // ── STEP 2: Vague recommendation → clarification question ─────────────────
  if (isVagueRecommendation(state.userMessage)) {
    console.log(`[Planner] Vague recommendation — asking clarification`);
    const question =
      "Do you have a preference?\n\n• Vegetarian\n• Non-vegetarian\n• Any";

    // Persist a goal stub so the clarification answer can be matched
    const stub: ActiveRecommendationGoal = {
      type: "spicy", // placeholder; will be overridden by clarification answer
      constraints: emptyConstraints(),
      excludedItemIds: [],
      awaitingClarification: true,
      clarificationQuestion: question,
    };
    await setRecommendationGoal(state.sessionId, stub);

    return {
      ...state,
      plannedTool: "clarify",
      awaitingRecommendationClarification: true,
      recommendationClarificationQuestion: question,
      toolCalls: [...state.toolCalls, "planner"],
    };
  }

  // ── STEP 3: Fresh recommendation detection ─────────────────────────────────
  // Detects recommendation queries purely from keywords; bypasses intent
  // classification so ordering intents are never disturbed.
  const recommendationQuery = detectRecommendation(state.userMessage);
  if (recommendationQuery) {
    console.log(`[Planner] Recommendation detected: type=${recommendationQuery.type}`);

    // Persist a new goal to session
    const newGoal: ActiveRecommendationGoal = {
      type: recommendationQuery.type,
      pairingReference: recommendationQuery.referenceItem,
      constraints: emptyConstraints(),
      excludedItemIds: [],
      awaitingClarification: false,
    };
    await setRecommendationGoal(state.sessionId, newGoal);

    return {
      ...state,
      plannedTool: "recommend",
      recommendationType: recommendationQuery.type,
      // Store budget/pairing parameters in existing state slots to avoid bloat
      searchQuery: recommendationQuery.referenceItem ?? state.searchQuery,
      quantity: recommendationQuery.budgetAmount ?? state.quantity,
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
