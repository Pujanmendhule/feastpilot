import type {
  Session,
  SessionSearchResult,
  SessionMenuItem,
  SessionMessage,
  SessionPreferences,
  SessionAssumptions,
} from "../types/session";
import { generateSessionId } from "./sessionId";
import { prisma } from "../db/prisma";
import type { Session as PrismaSession, Message as PrismaMessage } from "@prisma/client";

type PrismaSessionWithMessages = PrismaSession & { messages: PrismaMessage[] };

/** Map a Prisma Session row (with messages) to the in-memory Session interface. */
function toSession(row: PrismaSessionWithMessages): Session {
  return {
    id: row.id,
    cartId: row.cartId,
    selectedRestaurantId: row.selectedRestaurantId,
    awaitingRestaurantSelection: row.awaitingRestaurantSelection,
    lastSearchResults: (row.lastSearchResults as unknown) as SessionSearchResult[],
    lastViewedMenuItems: (row.lastViewedMenuItems as unknown) as SessionMenuItem[],
    lastReferencedMenuItemId: row.lastReferencedMenuItemId,
    lastReferencedMenuItemName: row.lastReferencedMenuItemName,
    messages: row.messages.map((m) => ({
      id: m.id,
      role: m.role as SessionMessage["role"],
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
    preferences: (row.preferences as unknown) as SessionPreferences,
    assumptions: (row.assumptions as unknown) as SessionAssumptions,
    activeRecommendationGoal: row.activeRecommendationGoal,
    recommendationConstraints: (row.recommendationConstraints as unknown) as Record<string, unknown> | null,
    excludedRecommendations: (row.excludedRecommendations as unknown) as string[] | null,
    lastRecommendationResults: (row.lastRecommendationResults as unknown) as Record<string, unknown>[] | null,
    awaitingRecommendationRefinement: row.awaitingRecommendationRefinement,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * PostgreSQL-backed session lifecycle via Prisma.
 * Public API mirrors the original in-memory SessionService.
 */
export class SessionService {
  async createSession(): Promise<Session> {
    const id = generateSessionId();
    const row = await prisma.session.create({
      data: { id },
      include: { messages: true },
    });
    return toSession(row);
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    const row = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { messages: true },
    });
    return row ? toSession(row) : undefined;
  }

  async attachCartToSession(
    sessionId: string,
    cartId: string
  ): Promise<Session> {
    const row = await prisma.session.update({
      where: { id: sessionId },
      data: { cartId },
      include: { messages: true },
    });
    return toSession(row);
  }

  async setSelectedRestaurant(
    sessionId: string,
    restaurantId: string
  ): Promise<Session> {
    const row = await prisma.session.update({
      where: { id: sessionId },
      data: { selectedRestaurantId: restaurantId },
      include: { messages: true },
    });
    return toSession(row);
  }

  async getSelectedRestaurant(sessionId: string): Promise<string | null> {
    const row = await prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!row) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return row.selectedRestaurantId;
  }

  async setAwaitingRestaurantSelection(
    sessionId: string,
    awaiting: boolean
  ): Promise<Session> {
    const row = await prisma.session.update({
      where: { id: sessionId },
      data: { awaitingRestaurantSelection: awaiting },
      include: { messages: true },
    });
    return toSession(row);
  }

  async isAwaitingRestaurantSelection(sessionId: string): Promise<boolean> {
    const row = await prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!row) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return row.awaitingRestaurantSelection;
  }

  async setLastSearchResults(
    sessionId: string,
    results: SessionSearchResult[]
  ): Promise<Session> {
    const row = await prisma.session.update({
      where: { id: sessionId },
      data: { lastSearchResults: results as any },
      include: { messages: true },
    });
    return toSession(row);
  }

  async getLastSearchResults(
    sessionId: string
  ): Promise<SessionSearchResult[]> {
    const row = await prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!row) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return (row.lastSearchResults as unknown) as SessionSearchResult[];
  }

  async setLastViewedMenuItems(
    sessionId: string,
    items: SessionMenuItem[]
  ): Promise<Session> {
    const row = await prisma.session.update({
      where: { id: sessionId },
      data: { lastViewedMenuItems: items as any },
      include: { messages: true },
    });
    return toSession(row);
  }

  async getLastViewedMenuItems(
    sessionId: string
  ): Promise<SessionMenuItem[]> {
    const row = await prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!row) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return (row.lastViewedMenuItems as unknown) as SessionMenuItem[];
  }

  async setLastReferencedItem(
    sessionId: string,
    itemId: string | null,
    itemName: string | null
  ): Promise<Session> {
    const row = await prisma.session.update({
      where: { id: sessionId },
      data: {
        lastReferencedMenuItemId: itemId,
        lastReferencedMenuItemName: itemName,
      },
      include: { messages: true },
    });
    return toSession(row);
  }

  async getLastReferencedItem(
    sessionId: string
  ): Promise<{ itemId: string; itemName: string } | null> {
    const row = await prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!row) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    if (!row.lastReferencedMenuItemId || !row.lastReferencedMenuItemName) {
      return null;
    }
    return {
      itemId: row.lastReferencedMenuItemId,
      itemName: row.lastReferencedMenuItemName,
    };
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await prisma.session.delete({ where: { id: sessionId } });
      return true;
    } catch {
      return false;
    }
  }
}

/** Shared session store for routes and agent. */
export const sessionService = new SessionService();
