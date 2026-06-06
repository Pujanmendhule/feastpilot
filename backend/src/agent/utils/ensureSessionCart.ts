import { createCart } from "../tools";
import { sessionService } from "../../services/SessionService";

export async function ensureSessionCart(sessionId: string): Promise<string> {
  const session = sessionService.getSession(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  if (session.cartId) {
    return session.cartId;
  }

  const created = await createCart();
  if (!created.success || !created.data) {
    throw new Error(created.error ?? "Failed to create cart");
  }

  sessionService.attachCartToSession(sessionId, created.data.id);
  return created.data.id;
}
