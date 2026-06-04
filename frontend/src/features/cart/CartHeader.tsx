import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MockCart } from "@/features/session/sessionState";

type CartHeaderProps = {
  cart: MockCart;
};

export function CartHeader({ cart }: CartHeaderProps) {
  const itemCount = cart.restaurantGroups.reduce(
    (total, group) => total + group.items.reduce((sum, item) => sum + item.quantity, 0),
    0,
  );

  return (
    <header className="border-b border-border bg-background px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Cart plan</h2>
            <p className="text-sm text-muted-foreground">
              {itemCount} items for {cart.peopleCount} people
            </p>
          </div>
        </div>
        <Badge variant="outline">{cart.status}</Badge>
      </div>
    </header>
  );
}
