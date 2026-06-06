/** Session message (empty at creation; appended during conversation). */
export interface SessionMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export type SessionPreferences = Record<string, unknown>;
export type SessionAssumptions = Record<string, unknown>;

/** Minimal restaurant snapshot persisted for selection matching. */
export interface SessionSearchResult {
  id: string;
  name: string;
}

export interface Session {
  id: string;
  cartId: string | null;
  /** Restaurant chosen during conversation; null until explicitly selected. */
  selectedRestaurantId: string | null;
  /** True after a search until the user picks a restaurant. */
  awaitingRestaurantSelection: boolean;
  /** Restaurants from the most recent search, used for selection matching. */
  lastSearchResults: SessionSearchResult[];
  messages: SessionMessage[];
  preferences: SessionPreferences;
  assumptions: SessionAssumptions;
  createdAt: string;
}
