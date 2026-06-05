import type { Session } from "../types/session";
import { generateSessionId } from "./sessionId";

function createEmptySession(id: string): Session {
  return {
    id,
    cartId: null,
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

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }
}

/** Shared in-memory session store for routes and agent. */
export const sessionService = new SessionService();
