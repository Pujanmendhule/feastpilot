/**
 * recommendationGoal.ts
 *
 * Type definitions for the multi-turn recommendation goal state.
 * This state is persisted in session.preferences (existing JSON column)
 * so no Prisma schema changes are required.
 */

import type { RecommendationType } from "../utils/recommendationEngine";

/**
 * Constraint set that narrows down which menu items are eligible.
 * Accumulated across refinement turns.
 */
export interface RecommendationConstraints {
  /** Must be vegetarian */
  mustBeVegetarian?: boolean;
  /** Must be non-vegetarian */
  mustBeNonVegetarian?: boolean;
  /** Maximum price ceiling in rupees */
  maxPrice?: number;
  /** Minimum price floor in rupees (for "more expensive" refinements) */
  minPrice?: number;
  /** Category keywords to exclude (e.g. ["biryani", "rice"]) */
  excludedCategories: string[];
  /** Item name keywords to exclude (e.g. ["biryani", "mutton"]) */
  excludedNameKeywords: string[];
  /** Specific item IDs already shown to user — never repeat */
  excludedItemIds: string[];
  /** Prefer spicier items */
  preferSpicy?: boolean;
  /** Prefer lighter / healthier items */
  preferHealthy?: boolean;
}

/**
 * The persisted recommendation goal across conversation turns.
 */
export interface ActiveRecommendationGoal {
  /** The primary recommendation type */
  type: RecommendationType;
  /** Reference item for pairing queries */
  pairingReference?: string;
  /** Accumulated constraints from refinement turns */
  constraints: RecommendationConstraints;
  /** IDs of items already recommended — never recommend again */
  excludedItemIds: string[];
  /** True when agent asked a clarification question and awaits user answer */
  awaitingClarification: boolean;
  /** The clarification question text shown to user (for context) */
  clarificationQuestion?: string;
}

/** The JSON shape stored under preferences.recommendationGoal */
export type RecommendationGoalPreference = ActiveRecommendationGoal | null;

/** Default empty constraints */
export function emptyConstraints(): RecommendationConstraints {
  return {
    excludedCategories: [],
    excludedNameKeywords: [],
    excludedItemIds: [],
  };
}
