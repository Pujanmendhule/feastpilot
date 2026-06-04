import type { Cart, Message, Session } from "./domain";

export interface ConversationRequest {
  sessionId: string;
  message: string;
  inputMode: "voice" | "chat";
}

export interface ConversationResponse {
  success: boolean;
  assistantMessage: Message;
  cart: Cart | null;
  requiresClarification: boolean;
}

export interface CreateSessionResponse {
  success: boolean;
  session: Session;
}

export interface SessionResponse {
  success: boolean;
  session: Session;
}

export interface VoiceTranscriptionResponse {
  success: boolean;
  transcript: string;
}

export interface VoiceSynthesisResponse {
  success: boolean;
  audioUrl: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}