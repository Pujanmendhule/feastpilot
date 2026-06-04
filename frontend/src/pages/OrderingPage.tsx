import { CartRegion } from "@/features/cart";
import { ConversationRegion } from "@/features/conversation";
import { mockSession, SessionInitializer } from "@/features/session";

export function OrderingPage() {
  return (
    <SessionInitializer session={mockSession}>
      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <ConversationRegion session={mockSession} />
        <CartRegion cart={mockSession.cart} />
      </main>
    </SessionInitializer>
  );
}
