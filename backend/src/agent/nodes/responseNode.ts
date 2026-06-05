import type { AgentState } from "../state/agentState";
import type { SearchRestaurantsResult } from "../tools";
import type { GetMenuResult } from "../tools";

const MAX_ITEMS = 5;

// ── Type guards ────────────────────────────────────────────────────────────

function isSearchResult(value: unknown): value is SearchRestaurantsResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "data" in value &&
    Array.isArray((value as SearchRestaurantsResult).data) &&
    ((value as SearchRestaurantsResult).data.length === 0 ||
      "name" in (value as SearchRestaurantsResult).data[0])
  );
}

function isMenuResult(value: unknown): value is GetMenuResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "data" in value &&
    Array.isArray((value as GetMenuResult).data) &&
    ((value as GetMenuResult).data.length === 0 ||
      "price" in (value as GetMenuResult).data[0])
  );
}

// ── Renderers ──────────────────────────────────────────────────────────────

function renderSearchResult(result: SearchRestaurantsResult): string {
  const count = result.data.length;
  if (count === 0) return "No restaurants found matching your request.";

  const names = result.data
    .slice(0, MAX_ITEMS)
    .map((r) => `• ${r.name}`)
    .join("\n");

  return `Found ${count} restaurant${count === 1 ? "" : "s"} matching your request:\n${names}`;
}

function renderMenuResult(result: GetMenuResult): string {
  const count = result.data.length;
  if (count === 0) return "No menu items found for this restaurant.";

  const items = result.data
    .slice(0, MAX_ITEMS)
    .map((item) => `• ${item.name}`)
    .join("\n");

  return `Menu contains ${count} item${count === 1 ? "" : "s"}:\n${items}`;
}

// ── Node ───────────────────────────────────────────────────────────────────

/**
 * Response Node
 *
 * Produces the final human-readable response from toolResult.
 *
 * Priority:
 *  1. SearchRestaurantsResult → "Found X restaurants…" + names
 *  2. GetMenuResult           → "Menu contains X items…" + item names
 *  3. Any other toolResult    → "Tool executed successfully."
 *  4. No toolResult           → "LangGraph response pipeline active."
 */
export async function responseNode(state: AgentState): Promise<AgentState> {
  let agentResponse: string;

  if (state.toolResult === undefined) {
    agentResponse = "LangGraph response pipeline active.";
  } else if (isSearchResult(state.toolResult)) {
    agentResponse = renderSearchResult(state.toolResult);
  } else if (isMenuResult(state.toolResult)) {
    agentResponse = renderMenuResult(state.toolResult);
  } else {
    agentResponse = "Tool executed successfully.";
  }

  return {
    ...state,
    agentResponse,
    toolCalls: [...state.toolCalls, "response-node"],
  };
}
