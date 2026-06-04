import type { Cart, Message } from "./domain";

export interface SessionPreferences {
  cuisines: string[];
  dietaryRestrictions: string[];
  spicePreference?: number;
}

export interface SessionConstraints {
  peopleCount?: number;
  budget?: number;
  preferredRestaurants?: string[];
}

export interface SessionState {
  sessionId: string;

  conversationHistory: Message[];

  preferences: SessionPreferences;

  constraints: SessionConstraints;

  cart: Cart | null;

  pendingQuestions: string[];

  lastUpdated: string;
}