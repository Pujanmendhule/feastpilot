import type {
  Session,
  SessionSearchResult,
  SessionMenuItem,
} from "../types/session";
import { generateSessionId } from "./sessionId";

function createEmptySession(id: string): Session {
  return {
    id,
    cartId: null,
    selectedRestaurantId: null,
    awaitingRestaurantSelection: false,
    lastSearchResults: [],
    lastViewedMenuItems: [],
    lastReferencedMenuItemId: null,
    lastReferencedMenuItemName: null,
    messages: [],
    preferences: {},
    assumptions: {},
    createdAt: new Date().toISOString(),
  };
}

/**
 * In-memory session lifecycle. Accepts an optional Map for unit tests.
 */
export class SessionService {
  private readonly sessions: Map<string, Session>;

  constructor(sessions: Map<string, Session> = new Map()) {
    this.sessions = sessions;
  }

  createSession(): Session {
    const session = createEmptySession(generateSessionId());
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  attachCartToSession(sessionId: string, cartId: string): Session {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    session.cartId = cartId;
    return session;
  }

  setSelectedRestaurant(sessionId: string, restaurantId: string): Session {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    session.selectedRestaurantId = restaurantId;
    return session;
  }

  getSelectedRestaurant(sessionId: string): string | null {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return session.selectedRestaurantId;
  }

  setAwaitingRestaurantSelection(
    sessionId: string,
    awaiting: boolean
  ): Session {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    session.awaitingRestaurantSelection = awaiting;
    return session;
  }

  isAwaitingRestaurantSelection(sessionId: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return session.awaitingRestaurantSelection;
  }

  setLastSearchResults(
    sessionId: string,
    results: SessionSearchResult[]
  ): Session {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    session.lastSearchResults = results;
    return session;
  }

  getLastSearchResults(sessionId: string): SessionSearchResult[] {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return session.lastSearchResults;
  }

  setLastViewedMenuItems(
    sessionId: string,
    items: SessionMenuItem[]
  ): Session {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    session.lastViewedMenuItems = items;
    return session;
  }

  getLastViewedMenuItems(sessionId: string): SessionMenuItem[] {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return session.lastViewedMenuItems;
  }

  setLastReferencedItem(
    sessionId: string,
    itemId: string,
    itemName: string
  ): Session {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    session.lastReferencedMenuItemId = itemId;
    session.lastReferencedMenuItemName = itemName;
    return session;
  }

  getLastReferencedItem(
    sessionId: string
  ): { itemId: string; itemName: string } | null {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    if (!session.lastReferencedMenuItemId || !session.lastReferencedMenuItemName) {
      return null;
    }
    return {
      itemId: session.lastReferencedMenuItemId,
      itemName: session.lastReferencedMenuItemName,
    };
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }
}

/** Shared in-memory session store for routes and agent. */
export const sessionService = new SessionService();
