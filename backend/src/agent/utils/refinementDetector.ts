/**
 * refinementDetector.ts
 *
 * Detects whether a user message is a recommendation refinement
 * (modifying an existing recommendation goal) vs. a new query.
 *
 * Refinement types:
 *   - EXCLUDE_ITEM     "not biryani", "no biryani"
 *   - EXCLUDE_CATEGORY "no rice", "not pizza"
 *   - CHEAPER          "cheaper", "lower price", "more affordable"
 *   - MORE_EXPENSIVE   "more expensive", "something pricier"
 *   - VEGETARIAN       "vegetarian", "veg"
 *   - NON_VEGETARIAN   "non-veg", "with chicken"
 *   - DIFFERENT        "different", "something else", "another option"
 *   - SPICIER          "more spicy", "spicier"
 *   - LESS_SPICY       "less spicy", "milder"
 *   - HEALTHIER        "healthier", "light", "healthy"
 *   - CLARIFY_ANSWER   answer to a clarification question (veg/non-veg/any)
 */

import type { RecommendationType } from "./recommendationEngine";

export type RefinementType =
  | "exclude_item"
  | "exclude_category"
  | "cheaper"
  | "more_expensive"
  | "vegetarian"
  | "non_vegetarian"
  | "different"
  | "spicier"
  | "less_spicy"
  | "healthier"
  | "budget_update"
  | "clarify_vegetarian"
  | "clarify_non_vegetarian"
  | "clarify_any";

export interface RefinementQuery {
  type: RefinementType;
  /** For exclude_item: the keyword the user mentioned */
  excludeKeyword?: string;
  /** For budget_update: the new price ceiling */
  budgetAmount?: number;
}

// ── Pattern tables ─────────────────────────────────────────────────────────────

const DIFFERENT_PATTERNS = [
  /\b(different|something\s+else|another\s+option|other\s+option|not\s+that|other\s+choice|show\s+me\s+another|give\s+me\s+another|next\s+one|try\s+another)\b/,
];

const CHEAPER_PATTERNS = [
  /\bcheap(er|est)?\b/,
  /\bmore\s+affordable\b/,
  /\blower\s+price\b/,
  /\bless\s+expensive\b/,
  /\breduced\s+price\b/,
  /\bon\s+a\s+budget\b/,
];

const MORE_EXPENSIVE_PATTERNS = [
  /\bmore\s+expensiv(e|er)\b/,
  /\bpricier\b/,
  /\bhigher\s+price\b/,
  /\bpremium\b/,
  /\bsomething\s+fancier\b/,
];

const BUDGET_UPDATE_PATTERNS = [
  /\bunder\s+[₹rs.]?\s*(\d+)\b/i,
  /\bbelow\s+[₹rs.]?\s*(\d+)\b/i,
  /\bless\s+than\s+[₹rs.]?\s*(\d+)\b/i,
  /\bwithin\s+[₹rs.]?\s*(\d+)\b/i,
];

const SPICIER_PATTERNS = [
  /\bspici(er|est)\b/,
  /\bmore\s+spicy\b/,
  /\bhotter\b/,
  /\bmore\s+heat\b/,
];

const LESS_SPICY_PATTERNS = [
  /\bless\s+spicy\b/,
  /\bmilder?\b/,
  /\bnot\s+(too\s+)?spicy\b/,
  /\bno\s+heat\b/,
];

const HEALTHY_PATTERNS = [
  /\bhealthi(er|est)?\b/,
  /\bhealthy\b/,
  /\blight(er)?\b/,
  /\blow.?calori(e|es)\b/,
  /\bless\s+(heavy|rich)\b/,
  /\bfit\b/,
];

const VEGETARIAN_PATTERNS = [
  /\bveget(arian|able)?\b/,
  /\bveg\b/,
  /\bplant.based\b/,
  /\bno\s+meat\b/,
  /\bmeatless\b/,
];

const NON_VEGETARIAN_PATTERNS = [
  /\bnon.?veg\b/,
  /\bwith\s+(chicken|mutton|meat|fish|egg)\b/,
  /\bchicken\b/,
  /\blamb\b/,
  /\bmutton\b/,
];

// Exclusion patterns: "not biryani", "no biryani", "without rice"
const EXCLUSION_PREFIX = /\b(not|no|without|except|skip|avoid|don'?t\s+want)\s+(.+)/i;

// Clarification answers when agent asked veg/non-veg/any
const CLARIFY_VEG_PATTERNS = [/^\s*veg(etarian)?\s*$/i, /^vegetarian$/i];
const CLARIFY_NONVEG_PATTERNS = [/^\s*non.?veg(etarian)?\s*$/i, /^non.?vegetarian$/i, /^chicken$/i, /^meat$/i];
const CLARIFY_ANY_PATTERNS = [/^\s*any\s*$/i, /^\s*(doesn'?t\s+matter|no\s+preference|either)\s*$/i];

// ── Budget extraction ──────────────────────────────────────────────────────────

function extractBudget(msg: string): number | undefined {
  for (const pat of BUDGET_UPDATE_PATTERNS) {
    const m = msg.match(pat);
    if (m?.[1]) return Number(m[1]);
  }
  return undefined;
}

// ── Exclusion extraction ───────────────────────────────────────────────────────

function extractExclusionKeyword(msg: string): string | undefined {
  const m = msg.match(EXCLUSION_PREFIX);
  if (!m) return undefined;
  // Clean up trailing punctuation
  return m[2].trim().replace(/[?.!]$/, "").trim().toLowerCase();
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Detect whether a message is a refinement of an active recommendation goal.
 * Returns null if the message is not a refinement.
 *
 * This is only called when there IS an active recommendation goal in session.
 */
export function detectRefinement(userMessage: string): RefinementQuery | null {
  const msg = userMessage.trim().toLowerCase();

  // 1. Clarification answers (very short, very specific)
  if (CLARIFY_VEG_PATTERNS.some((p) => p.test(msg))) {
    return { type: "clarify_vegetarian" };
  }
  if (CLARIFY_NONVEG_PATTERNS.some((p) => p.test(msg))) {
    return { type: "clarify_non_vegetarian" };
  }
  if (CLARIFY_ANY_PATTERNS.some((p) => p.test(msg))) {
    return { type: "clarify_any" };
  }

  // 2. Budget update (must check before cheaper to capture numeric)
  const budgetAmount = extractBudget(msg);
  if (budgetAmount !== undefined) {
    return { type: "budget_update", budgetAmount };
  }

  // 3. Cheaper / more expensive
  if (CHEAPER_PATTERNS.some((p) => p.test(msg))) {
    return { type: "cheaper" };
  }
  if (MORE_EXPENSIVE_PATTERNS.some((p) => p.test(msg))) {
    return { type: "more_expensive" };
  }

  // 4. Spiciness modifiers
  if (SPICIER_PATTERNS.some((p) => p.test(msg))) {
    return { type: "spicier" };
  }
  if (LESS_SPICY_PATTERNS.some((p) => p.test(msg))) {
    return { type: "less_spicy" };
  }

  // 5. Healthier
  if (HEALTHY_PATTERNS.some((p) => p.test(msg))) {
    return { type: "healthier" };
  }

  // 6. Vegetarian / non-veg type switch
  if (VEGETARIAN_PATTERNS.some((p) => p.test(msg))) {
    return { type: "vegetarian" };
  }
  if (NON_VEGETARIAN_PATTERNS.some((p) => p.test(msg))) {
    return { type: "non_vegetarian" };
  }

  // 7. Exclusion: "not biryani", "no rice"
  const exclusionKeyword = extractExclusionKeyword(msg);
  if (exclusionKeyword) {
    return { type: "exclude_item", excludeKeyword: exclusionKeyword };
  }

  // 8. Different / another option
  if (DIFFERENT_PATTERNS.some((p) => p.test(msg))) {
    return { type: "different" };
  }

  return null;
}

/**
 * Detect whether the user message is a vague recommendation request
 * that needs clarification (e.g. "Recommend food", "suggest something",
 * "what should I eat").
 *
 * Returns true only when the message has a recommendation trigger
 * but NO specific type cues (no spicy/veg/dessert/budget keywords).
 */
export function isVagueRecommendation(userMessage: string): boolean {
  const msg = userMessage.trim().toLowerCase();

  // Must have a recommendation trigger
  const hasTrigger = /\b(suggest|recommend|what\s+should\s+i|what\s+to\s+eat|what\s+to\s+order|help\s+me\s+(choose|pick|decide)|i\s+(can'?t\s+decide|don'?t\s+know\s+what))\b/i.test(msg);
  if (!hasTrigger) return false;

  // Must NOT already be specific
  const hasSpecific =
    /\bspic(y|ier)\b/.test(msg) ||
    /\bveget(arian)?\b/.test(msg) ||
    /\bveg\b/.test(msg) ||
    /\bdessert\b/.test(msg) ||
    /\bsweet\b/.test(msg) ||
    /\bunder\s+[₹\d]/.test(msg) ||
    /\bcheap\b/.test(msg) ||
    /\bbest\s+value\b/.test(msg) ||
    /\bpair/.test(msg) ||
    /\bgoes\s+well\s+with\b/.test(msg);

  return !hasSpecific;
}

/**
 * Map a RefinementType clarification answer to a RecommendationType.
 * Used when the user answers the clarification question.
 */
export function clarifyAnswerToType(
  refinement: RefinementType,
  originalType: RecommendationType
): RecommendationType {
  if (refinement === "clarify_vegetarian") return "vegetarian";
  if (refinement === "clarify_non_vegetarian") return "spicy"; // default non-veg = recommend spicy
  return originalType; // "any" → keep original
}
