/** Session message (empty at creation; appended during conversation). */
export interface SessionMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export type SessionPreferences = Record<string, unknown>;
export type SessionAssumptions = Record<string, unknown>;

export interface Session {
  id: string;
  cartId: string | null;
  /** Restaurant chosen during conversation; null until a search selects one. */
  selectedRestaurantId: string | null;
  messages: SessionMessage[];
  preferences: SessionPreferences;
  assumptions: SessionAssumptions;
  createdAt: string;
}
