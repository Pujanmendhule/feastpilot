import type { AgentState } from "../state/agentState";
import type { SearchRestaurantsResult } from "../tools";

/** Maximum number of restaurant names to include in the response */
const MAX_NAMES = 5;

/**
 * Type guard — checks whether a value looks like a SearchRestaurantsResult.
 */
function isSearchResult(value: unknown): value is SearchRestaurantsResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "data" in value &&
    Array.isArray((value as SearchRestaurantsResult).data)
  );
}

/**
 * Builds a human-readable restaurant listing from a SearchRestaurantsResult.
 *
 * Example output (4 matches):
 *   Found 4 restaurants matching your request:
 *   • Behrouz Biryani
 *   • Biryani Blues
 *   • Paradise Biryani
 *   • Bikkgane Biryani
 */
function renderSearchResult(result: SearchRestaurantsResult): string {
  const count = result.data.length;

  if (count === 0) {
    return "No restaurants found matching your request.";
  }

  const names = result.data
    .slice(0, MAX_NAMES)
    .map((r) => `• ${r.name}`)
    .join("\n");

  return `Found ${count} restaurant${count === 1 ? "" : "s"} matching your request:\n${names}`;
}

/**
 * Response Node
 *
 * Produces the final response to send back to the client.
 *
 * Current behaviour:
 *  - toolResult is a SearchRestaurantsResult → renders count + names (up to 5)
 *  - toolResult is present but unrecognised → "Tool executed successfully."
 *  - toolResult is absent → "LangGraph response pipeline active."
 *
 * Future: replace with an LLM-composed reply using the full tool result.
 */
export async function responseNode(state: AgentState): Promise<AgentState> {
  let agentResponse: string;

  if (state.toolResult === undefined) {
    agentResponse = "LangGraph response pipeline active.";
  } else if (isSearchResult(state.toolResult)) {
    agentResponse = renderSearchResult(state.toolResult);
  } else {
    agentResponse = "Tool executed successfully.";
  }

  return {
    ...state,
    agentResponse,
    toolCalls: [...state.toolCalls, "response-node"],
  };
}
