import { type ApiCart } from "../../services/api";
import { Sparkles } from "lucide-react";

type CartTotalsProps = {
  cart: ApiCart;
};

export function CartTotals({ cart }: CartTotalsProps) {
  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = cart.subtotal;
  // Estimate delivery fee: ₹30 per restaurant
  const deliveryFee = cart.restaurants.length * 30;
  const grandTotal = subtotal + deliveryFee;

  return (
    <section className="mt-4 rounded-xl border border-border/60 bg-gradient-to-br from-card/80 to-card/40 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Order Summary</h3>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground font-medium">
            Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})
          </span>
          <span className="font-semibold text-foreground">₹{subtotal.toFixed(0)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground font-medium">Delivery fee</span>
          <span className="font-semibold text-foreground">₹{deliveryFee}</span>
        </div>
        <div className="flex justify-between gap-4 border-t border-border/60 pt-3 text-base">
          <span className="font-extrabold text-foreground">Total</span>
          <span className="font-extrabold text-primary">₹{grandTotal.toFixed(0)}</span>
        </div>
      </div>
    </section>
  );
}
