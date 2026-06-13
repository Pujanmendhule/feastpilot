/**
 * recommendationGoalStore.ts
 *
 * Reads and writes the ActiveRecommendationGoal from/to session.preferences
 * (the existing PostgreSQL Json column — no schema changes needed).
 *
 * Key: "recommendationGoal" inside the preferences object.
 */

import { prisma } from "../../db/prisma";
import type { ActiveRecommendationGoal, RecommendationGoalPreference } from "../types/recommendationGoal";
import { emptyConstraints } from "../types/recommendationGoal";

const GOAL_KEY = "recommendationGoal";

/**
 * Read the current recommendation goal for a session.
 * Returns null when no goal is active.
 */
export async function getRecommendationGoal(
  sessionId: string
): Promise<ActiveRecommendationGoal | null> {
  const row = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      preferences: true,
      activeRecommendationGoal: true,
      recommendationConstraints: true,
      excludedRecommendations: true,
      awaitingRecommendationRefinement: true,
    },
  });
  if (!row) return null;

  if (row.activeRecommendationGoal) {
    const constraints = (row.recommendationConstraints as any) ?? emptyConstraints();
    const pairingReference = constraints.pairingReference;
    const clarificationQuestion = constraints.clarificationQuestion;

    const cleanConstraints = { ...constraints };
    delete cleanConstraints.pairingReference;
    delete cleanConstraints.clarificationQuestion;

    return {
      type: row.activeRecommendationGoal as any,
      constraints: cleanConstraints,
      excludedItemIds: (row.excludedRecommendations as string[]) ?? [],
      awaitingClarification: row.awaitingRecommendationRefinement,
      pairingReference,
      clarificationQuestion,
    };
  }

  const prefs = (row.preferences as Record<string, unknown>) ?? {};
  const goal = prefs[GOAL_KEY] as RecommendationGoalPreference;
  return goal ?? null;
}

/**
 * Persist a recommendation goal for a session.
 * Merges into the existing preferences object so other preference keys
 * are not disturbed.
 */
export async function setRecommendationGoal(
  sessionId: string,
  goal: ActiveRecommendationGoal | null
): Promise<void> {
  const row = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { preferences: true },
  });
  if (!row) return;

  const prefs = ((row.preferences as Record<string, unknown>) ?? {}) as Record<string, unknown>;
  
  let activeRecommendationGoal: string | null = null;
  let recommendationConstraints: any = null;
  let excludedRecommendations: any = null;
  let awaitingRecommendationRefinement = false;

  if (goal === null) {
    delete prefs[GOAL_KEY];
  } else {
    prefs[GOAL_KEY] = goal;
    activeRecommendationGoal = goal.type;
    recommendationConstraints = {
      ...goal.constraints,
      pairingReference: goal.pairingReference,
      clarificationQuestion: goal.clarificationQuestion,
    };
    excludedRecommendations = goal.excludedItemIds;
    awaitingRecommendationRefinement = goal.awaitingClarification;
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: {
      preferences: prefs as any,
      activeRecommendationGoal,
      recommendationConstraints,
      excludedRecommendations,
      awaitingRecommendationRefinement,
    },
  });
}

/**
 * Clear the active recommendation goal (end of multi-turn session).
 */
export async function clearRecommendationGoal(sessionId: string): Promise<void> {
  await setRecommendationGoal(sessionId, null);
}
