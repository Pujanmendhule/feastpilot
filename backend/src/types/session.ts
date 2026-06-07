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

/** Minimal menu item snapshot for cart matching without repeated lookups. */
export interface SessionMenuItem {
  id: string;
  name: string;
  restaurantId: string;
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
  /** Menu items from the most recent menu view or fetch for this session. */
  lastViewedMenuItems: SessionMenuItem[];
  /** Most recently discussed menu item ID — used for pronoun resolution. */
  lastReferencedMenuItemId: string | null;
  /** Most recently discussed menu item name — used for pronoun resolution. */
  lastReferencedMenuItemName: string | null;
  messages: SessionMessage[];
  preferences: SessionPreferences;
  assumptions: SessionAssumptions;
  createdAt: string;
}
