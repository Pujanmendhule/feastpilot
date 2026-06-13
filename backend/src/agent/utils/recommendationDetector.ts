/**
 * recommendationDetector.ts
 *
 * Detects whether a user message is a recommendation query and extracts
 * the type and any relevant parameters (e.g., budget amount, reference item).
 *
 * Runs before ModelService in plannerNode — recommendation queries are
 * handled entirely by the reasoning engine, not intent classification.
 */

import type { RecommendationType } from "./recommendationEngine";

export interface RecommendationQuery {
  type: RecommendationType;
  /** Budget ceiling in rupees (for "budget" type only). */
  budgetAmount?: number;
  /** Reference item name (for "pairing" type only). */
  referenceItem?: string;
}

// ── Keyword tables ────────────────────────────────────────────────────────────

const SPICY_PATTERNS = [
  /\bspic(y|ier|iest)\b/,
  /\bhot\b.*\b(dish|item|option|food)\b/,
  /\bfiery\b/,
  /\bsuggest.*spic/,
  /\brecommend.*spic/,
  /\bspic.*suggest\b/,
  /\bspic.*recommend\b/,
  /\bsomething\s+spicy\b/,
  /\bspicy\s+option\b/,
  /\bspicy\s+food\b/,
];

const VEGETARIAN_PATTERNS = [
  /\bveget(arian|able)\b/,
  /\bveg\b/,
  /\bplant.based\b/,
  /\bno\s+meat\b/,
  /\bwithout\s+meat\b/,
  /\bmeatless\b/,
];

const DESSERT_PATTERNS = [
  /\bdessert\b/,
  /\bsweet\b/,
  /\bcake\b/,
  /\bpastry\b/,
  /\bice.cream\b/,
  /\bafter.?meal\b/,
  /\bpudding\b/,
];

const PAIRING_PATTERNS = [
  /\bpair(s|ed|ing)?\s+well\s+with\b/,
  /\bwhat\s+goes\s+well\s+with\b/,
  /\bgood\s+with\b/,
  /\bwhat\s+to\s+have\s+with\b/,
  /\bside\s+for\b/,
  /\bcomplement\b/,
  /\bto\s+go\s+with\b/,
];

const BUDGET_PATTERNS = [
  /\bunder\s+[₹rs.]?\s*(\d+)\b/i,
  /\bbelow\s+[₹rs.]?\s*(\d+)\b/i,
  /\bless\s+than\s+[₹rs.]?\s*(\d+)\b/i,
  /\bwithin\s+[₹rs.]?\s*(\d+)\b/i,
  /\bcheap(?:er|est)?\b/,
  /\baffordable\b/,
  /\bbudget\b/,
  /\binexpensive\b/,
  /\beconomical\b/,
];

const VALUE_PATTERNS = [
  /\bbest\s+value\b/,
  /\bvalue\s+for\s+money\b/,
  /\bbest\s+deal\b/,
  /\bmost\s+filling\b/,
  /\bbest\s+bang\b/,
  /\bworth\s+it\b/,
  /\bgood\s+value\b/,
  /\bprice.?to.?portion\b/,
];

// ── Intent helpers ────────────────────────────────────────────────────────────

const RECOMMEND_TRIGGER = /\b(suggest|recommend|what(?:'s|\s+is|\s+are)?\s+(?:a\s+)?good|best|top)\b/i;
const OPTION_TRIGGER = /\b(option|choice|pick|item|dish|food|something)\b/i;

function isRecommendationContext(msg: string): boolean {
  return RECOMMEND_TRIGGER.test(msg) || OPTION_TRIGGER.test(msg);
}

// ── Budget extraction ─────────────────────────────────────────────────────────

function extractBudget(msg: string): number | undefined {
  for (const pat of BUDGET_PATTERNS) {
    const m = msg.match(pat);
    if (m && m[1]) return Number(m[1]);
  }
  // Generic "cheap" / "affordable" / "budget" without a number → ₹300
  if (/\b(cheap|affordable|budget|inexpensive|economical)\b/i.test(msg)) {
    return 300;
  }
  return undefined;
}

// ── Pairing extraction ────────────────────────────────────────────────────────
//
// Extract the item being referenced in "what goes well with <X>".

const PAIRING_ITEM_EXTRACTORS = [
  /what\s+goes\s+well\s+with\s+(.+?)[\?.]?$/i,
  /pairs?\s+well\s+with\s+(.+?)[\?.]?$/i,
  /good\s+with\s+(.+?)[\?.]?$/i,
  /to\s+have\s+with\s+(.+?)[\?.]?$/i,
  /side\s+for\s+(.+?)[\?.]?$/i,
  /complement(?:s)?\s+(.+?)[\?.]?$/i,
  /to\s+go\s+with\s+(.+?)[\?.]?$/i,
];

function extractPairingItem(msg: string): string | undefined {
  for (const pat of PAIRING_ITEM_EXTRACTORS) {
    const m = msg.match(pat);
    if (m?.[1]) return m[1].trim().replace(/[?.!]$/, "").trim();
  }
  return undefined;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Analyse a user message and return a RecommendationQuery if it is a
 * recommendation request, or null if it is not.
 */
export function detectRecommendation(userMessage: string): RecommendationQuery | null {
  // Normalize to lowercase so all patterns match regardless of input casing.
  const msg = userMessage.trim().toLowerCase();

  // 1. Pairing — most specific, check first
  if (PAIRING_PATTERNS.some((p) => p.test(msg))) {
    const referenceItem = extractPairingItem(msg) ?? "the item";
    return { type: "pairing", referenceItem };
  }

  // 2. Budget — check before generic "recommend" so we capture numeric patterns
  const hasBudgetKeyword = BUDGET_PATTERNS.some((p) => p.test(msg));
  if (hasBudgetKeyword && (isRecommendationContext(msg) || hasBudgetKeyword)) {
    const budgetAmount = extractBudget(msg);
    return { type: "budget", budgetAmount };
  }

  // For the remaining types we require at least a recommendation trigger word
  // OR an option trigger word so we don't accidentally fire on ordering messages
  // like "add spicy chicken".
  const hasContext = isRecommendationContext(msg);

  // 3. Value
  if (VALUE_PATTERNS.some((p) => p.test(msg))) {
    return { type: "value" };
  }

  // 4. Spicy
  if (SPICY_PATTERNS.some((p) => p.test(msg)) && hasContext) {
    return { type: "spicy" };
  }

  // 5. Vegetarian
  if (VEGETARIAN_PATTERNS.some((p) => p.test(msg)) && hasContext) {
    return { type: "vegetarian" };
  }

  // 6. Dessert
  if (DESSERT_PATTERNS.some((p) => p.test(msg)) && hasContext) {
    return { type: "dessert" };
  }

  return null;
}


