import type { MockCart } from "@/features/session/sessionState";
import { formatInr } from "@/features/session/sessionState";

type CartTotalsProps = {
  cart: MockCart;
};

export function CartTotals({ cart }: CartTotalsProps) {
  const subtotal = cart.restaurantGroups.reduce((sum, group) => sum + group.subtotal, 0);

  return (
    <section className="mt-4 rounded-md border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold">Summary</h3>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Item subtotal</span>
          <span className="font-medium">{formatInr(subtotal)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Estimated fees</span>
          <span className="font-medium">{formatInr(cart.estimatedFees)}</span>
        </div>
        <div className="flex justify-between gap-4 border-t border-border pt-3 text-base">
          <span className="font-semibold">Mock total</span>
          <span className="font-semibold">{formatInr(cart.grandTotal)}</span>
        </div>
      </div>
    </section>
  );
}
