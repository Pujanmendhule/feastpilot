import { type ApiCart } from "../../services/api";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type CartHeaderProps = {
  cart: ApiCart;
};

export function CartHeader({ cart }: CartHeaderProps) {
  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  const restaurantCount = cart.restaurants.length;

  return (
    <header className="border-b border-border/60 bg-card/50 px-4 py-4 shrink-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <ShoppingCart className="h-5 w-5 text-primary" />
            {itemCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-extrabold text-primary-foreground shadow-sm">
                {itemCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-foreground">Your Cart</h2>
            <p className="text-[10px] text-muted-foreground font-medium">
              {restaurantCount > 0
                ? `${restaurantCount} restaurant${restaurantCount > 1 ? "s" : ""}`
                : "Empty"}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-bold border-primary/20 text-primary bg-primary/5"
        >
          ₹{cart.subtotal.toFixed(0)}
        </Badge>
      </div>
    </header>
  );
}
