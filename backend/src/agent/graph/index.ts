import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { plannerNode } from "../nodes/plannerNode";
import { toolNode } from "../nodes/toolNode";
import { responseNode } from "../nodes/responseNode";
import type { CartAction } from "../types/toolResults";
import type { RecommendationResult } from "../utils/recommendationEngine";

// ── State Annotation ─────────────────────────────────────────────────────────
//
// LangGraph requires every field to declare a reducer.  We use the simplest
// possible strategy: last value wins (the node's return value replaces the
// current channel value).  This mirrors the prior sequential behaviour where
// each node spread `...state` and overwrote fields as needed.
//
// The shape mirrors AgentState in ../state/agentState.ts exactly — keeping
// both in sync is the only maintenance burden introduced by this migration.

const AgentStateAnnotation = Annotation.Root({
  sessionId: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  userMessage: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  agentResponse: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  cartId: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  toolCalls: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  plannedTool: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  toolResult: Annotation<unknown>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
  restaurantId: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  menuItemId: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  quantity: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 1,
  }),
  searchQuery: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  cartAction: Annotation<CartAction | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  menuItemQuery: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  resolvedMenuItemName: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  intent: Annotation<string | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
  intentConfidence: Annotation<number | undefined>({
    reducer: (_prev, next) => next,
    default: () => undefined,
  }),
  recommendationType: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  recommendationResult: Annotation<RecommendationResult | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  awaitingRecommendationClarification: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
  recommendationClarificationQuestion: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
});

// ── Graph definition ─────────────────────────────────────────────────────────

const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("plannerNode", plannerNode)
  .addNode("toolNode", toolNode)
  .addNode("responseNode", responseNode)
  .addEdge(START, "plannerNode")
  .addEdge("plannerNode", "toolNode")
  .addEdge("toolNode", "responseNode")
  .addEdge("responseNode", END);

export const graph = workflow.compile();
