/**
 * recommendationEngine.ts
 *
 * Pure menu-reasoning layer for FeastPilot Advanced Reasoning V1.
 *
 * Derives all recommendations solely from existing menu metadata:
 *   - category     → dessert / spice category heuristics
 *   - isVegetarian → vegetarian filtering
 *   - price        → budget and value scoring
 *   - name         → spice and pairing keyword matching
 *   - servingEstimate → value-per-portion scoring
 *
 * No external knowledge base, RAG, or vector database is used.
 */

import type { MockMenuItem } from "../../data/mock/types";
import { MockMenuService } from "../../services/MockMenuService";
import { MockRestaurantService } from "../../services/MockRestaurantService";

const mockMenuService = new MockMenuService();
const mockRestaurantService = new MockRestaurantService();

// ── Types ─────────────────────────────────────────────────────────────────────

export type RecommendationType =
  | "spicy"
  | "vegetarian"
  | "dessert"
  | "pairing"
  | "budget"
  | "value";

export interface RecommendationResult {
  type: RecommendationType;
  item: MockMenuItem;
  restaurantId: string;
  rationale: string;
  /** For pairing: the reference item the recommendation is paired with. */
  pairedWith?: string;
}

// ── Spice heuristics ─────────────────────────────────────────────────────────
//
// The menu JSON has spiceLevel=0 for all items (default).  We infer spice from
// name/category keywords that are well-established in Indian & Asian cuisine.

const SPICY_NAME_KEYWORDS = [
  "schezwan",
  "manchurian",
  "hot",
  "spicy",
  "pepper",
  "chilli",
  "chili",
  "kimchi",
  "dum",        // Dum biryani is aromatic-spicy
  "biryani",    // Biryani is the core spicy main at Behrouz / BBK
  "tikka",
  "peri",
  "sriracha",
  "barbecue",
  "bbq",
  "zinger",
  "korma",
];

const SPICY_CATEGORY_KEYWORDS = [
  "starter",  // Chinese starters (Manchurian, etc.) are typically spicy
];

function spiceScore(item: MockMenuItem): number {
  const nameLower = item.name.toLowerCase();
  const categoryLower = item.category.toLowerCase();
  let score = 0;

  for (const kw of SPICY_NAME_KEYWORDS) {
    if (nameLower.includes(kw)) score += 2;
  }
  for (const kw of SPICY_CATEGORY_KEYWORDS) {
    if (categoryLower.includes(kw)) score += 1;
  }

  return score;
}

// ── Dessert detection ─────────────────────────────────────────────────────────

const DESSERT_CATEGORIES = new Set(["dessert", "sweet", "cake", "pastry"]);
const DESSERT_NAME_KEYWORDS = [
  "cake", "brownie", "cheesecake", "tiramisu", "gulab", "jamun",
  "firni", "kheer", "ice cream", "gelato", "pudding", "mousse",
  "tart", "pastry",
];

function isDessert(item: MockMenuItem): boolean {
  if (DESSERT_CATEGORIES.has(item.category.toLowerCase())) return true;
  const nameLower = item.name.toLowerCase();
  return DESSERT_NAME_KEYWORDS.some((kw) => nameLower.includes(kw));
}

// ── Category-based pairing logic ──────────────────────────────────────────────
//
// Pairing rules (data-driven, no hardcoding of item IDs):
//   main course / biryani  → pairs with dessert
//   dessert                → pairs with main course / biryani
//   pizza / burger / noodles → pairs with a side
//   side                   → pairs with a main / pizza

const MAIN_CATEGORIES = new Set([
  "biryani", "main course", "rice", "rice bowl", "noodles",
  "pizza", "burger", "sandwich", "mexican", "sushi",
]);

const SIDE_CATEGORIES = new Set(["sides", "side", "snacks", "snack", "starter", "appetizer"]);

function categoryGroup(item: MockMenuItem): "main" | "dessert" | "side" | "other" {
  const cat = item.category.toLowerCase();
  if (isDessert(item)) return "dessert";
  if (MAIN_CATEGORIES.has(cat)) return "main";
  if (SIDE_CATEGORIES.has(cat)) return "side";
  return "other";
}

// ── Value scoring ─────────────────────────────────────────────────────────────
//
// value = servingEstimate / price  (higher = better value per rupee)

function valueScore(item: MockMenuItem): number {
  if (item.price === 0) return 0;
  return item.servingEstimate / item.price;
}

// ── Restaurant context resolution ─────────────────────────────────────────────
//
// When a restaurant is selected, recommend from that restaurant's menu.
// Otherwise, scan all available menus.

function getMenuItems(restaurantId: string | null): Array<{ item: MockMenuItem; restaurantId: string }> {
  if (restaurantId) {
    const menu = mockMenuService.getMenuByRestaurantId(restaurantId);
    if (menu) {
      return menu.items
        .filter((i) => i.isAvailable)
        .map((item) => ({ item, restaurantId }));
    }
  }

  // No restaurant selected — scan all
  const restaurants = mockRestaurantService.getAvailableRestaurants();
  const results: Array<{ item: MockMenuItem; restaurantId: string }> = [];
  for (const r of restaurants) {
    const menu = mockMenuService.getMenuByRestaurantId(r.id);
    if (!menu) continue;
    for (const item of menu.items) {
      if (item.isAvailable) results.push({ item, restaurantId: r.id });
    }
  }
  return results;
}

// ── Public recommendation functions ──────────────────────────────────────────

/**
 * Recommend the spiciest available item in the current restaurant context.
 */
export function recommendSpicy(restaurantId: string | null): RecommendationResult | null {
  const candidates = getMenuItems(restaurantId);
  if (candidates.length === 0) return null;

  const scored = candidates
    .map((c) => ({ ...c, score: spiceScore(c.item) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = scored[0] ?? candidates[0];
  return {
    type: "spicy",
    item: best.item,
    restaurantId: best.restaurantId,
    rationale: `${best.item.name} is one of the spicier options available at ₹${best.item.price}.`,
  };
}

/**
 * Recommend the best vegetarian item.
 * Prefers main-course vegetarian over sides.
 */
export function recommendVegetarian(restaurantId: string | null): RecommendationResult | null {
  const candidates = getMenuItems(restaurantId).filter((c) => c.item.isVegetarian);
  if (candidates.length === 0) return null;

  // Prefer mains, then anything
  const mains = candidates.filter((c) => categoryGroup(c.item) === "main");
  const pool = mains.length > 0 ? mains : candidates;

  // Among mains, prefer highest serving estimate then lowest price
  const best = pool.sort((a, b) => {
    if (b.item.servingEstimate !== a.item.servingEstimate) {
      return b.item.servingEstimate - a.item.servingEstimate;
    }
    return a.item.price - b.item.price;
  })[0];

  return {
    type: "vegetarian",
    item: best.item,
    restaurantId: best.restaurantId,
    rationale: `${best.item.name} is one of the strongest vegetarian choices, priced at ₹${best.item.price}.`,
  };
}

/**
 * Recommend the best dessert.
 * Prefers highest rating (approximated by highest value score since no rating
 * exists on menu items) and lowest price for approachability.
 */
export function recommendDessert(restaurantId: string | null): RecommendationResult | null {
  const candidates = getMenuItems(restaurantId).filter((c) => isDessert(c.item));
  if (candidates.length === 0) return null;

  // Sort: lowest price first (most accessible dessert recommendation)
  const best = candidates.sort((a, b) => a.item.price - b.item.price)[0];

  return {
    type: "dessert",
    item: best.item,
    restaurantId: best.restaurantId,
    rationale: `${best.item.name} is a great dessert option at ₹${best.item.price}.`,
  };
}

/**
 * Recommend a pairing for a named item.
 * Logic:
 *   - main → find a dessert or side from the same restaurant
 *   - dessert → find a main from the same restaurant
 *   - side → find a main from the same restaurant
 */
export function recommendPairing(
  referenceItemName: string,
  restaurantId: string | null
): RecommendationResult | null {
  const allCandidates = getMenuItems(restaurantId);
  if (allCandidates.length === 0) return null;

  // Find the reference item by name similarity
  const nameLower = referenceItemName.toLowerCase();
  const refEntry = allCandidates.find((c) =>
    c.item.name.toLowerCase().includes(nameLower) ||
    nameLower.includes(c.item.name.toLowerCase())
  );

  const refGroup = refEntry ? categoryGroup(refEntry.item) : "main";
  const refRestaurantId = refEntry?.restaurantId ?? restaurantId;

  // Pair within the same restaurant context
  const sameRestaurant = refRestaurantId
    ? allCandidates.filter((c) => c.restaurantId === refRestaurantId)
    : allCandidates;

  const exclude = refEntry?.item.id;

  let pairingCandidates: typeof sameRestaurant;
  if (refGroup === "main") {
    // Mains pair with desserts first, then sides
    const desserts = sameRestaurant.filter((c) => categoryGroup(c.item) === "dessert" && c.item.id !== exclude);
    const sides = sameRestaurant.filter((c) => categoryGroup(c.item) === "side" && c.item.id !== exclude);
    pairingCandidates = desserts.length > 0 ? desserts : sides;
  } else if (refGroup === "dessert") {
    pairingCandidates = sameRestaurant.filter((c) => categoryGroup(c.item) === "main" && c.item.id !== exclude);
  } else {
    pairingCandidates = sameRestaurant.filter((c) => categoryGroup(c.item) === "main" && c.item.id !== exclude);
  }

  // Fallback to any different item in same restaurant
  if (pairingCandidates.length === 0) {
    pairingCandidates = sameRestaurant.filter((c) => c.item.id !== exclude);
  }

  if (pairingCandidates.length === 0) return null;

  const best = pairingCandidates[0];
  return {
    type: "pairing",
    item: best.item,
    restaurantId: best.restaurantId,
    rationale: `${best.item.name} pairs well with ${refEntry?.item.name ?? referenceItemName}.`,
    pairedWith: refEntry?.item.name ?? referenceItemName,
  };
}

/**
 * Recommend an item under a given price budget.
 * Prefers mains, then any available item, picking the best value within budget.
 */
export function recommendBudget(
  maxPrice: number,
  restaurantId: string | null
): RecommendationResult | null {
  const candidates = getMenuItems(restaurantId).filter((c) => c.item.price <= maxPrice);
  if (candidates.length === 0) return null;

  // Prefer main-course items for meaningful recommendations
  const mains = candidates.filter((c) => categoryGroup(c.item) === "main");
  const pool = mains.length > 0 ? mains : candidates;

  // Pick the highest value item within budget
  const best = pool.sort((a, b) => valueScore(b.item) - valueScore(a.item))[0];

  return {
    type: "budget",
    item: best.item,
    restaurantId: best.restaurantId,
    rationale: `${best.item.name} is ₹${best.item.price} — well within your ₹${maxPrice} budget.`,
  };
}

/**
 * Recommend the best value item (highest servingEstimate / price ratio).
 */
export function recommendValue(restaurantId: string | null): RecommendationResult | null {
  const candidates = getMenuItems(restaurantId);
  if (candidates.length === 0) return null;

  // Exclude beverages and very cheap sides from "value" recommendations
  const mains = candidates.filter((c) => categoryGroup(c.item) === "main");
  const pool = mains.length > 0 ? mains : candidates;

  const best = pool.sort((a, b) => valueScore(b.item) - valueScore(a.item))[0];

  const ratio = (best.item.servingEstimate / best.item.price * 100).toFixed(1);
  return {
    type: "value",
    item: best.item,
    restaurantId: best.restaurantId,
    rationale: `${best.item.name} at ₹${best.item.price} serves ${best.item.servingEstimate} — one of the best value-per-portion options.`,
  };
}
