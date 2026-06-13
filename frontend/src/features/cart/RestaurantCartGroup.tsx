import { type ApiCartItem } from "../../services/api";
import { CartItemList } from "./CartItemList";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed } from "lucide-react";

type RestaurantGroup = {
  restaurantId: string;
  restaurantName: string;
  items: ApiCartItem[];
  subtotal: number;
};

type RestaurantCartGroupProps = {
  group: RestaurantGroup;
};

export function RestaurantCartGroup({ group }: RestaurantCartGroupProps) {
  const itemCount = group.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <section className="rounded-xl border border-border/60 bg-card/60 overflow-hidden shadow-sm">
      {/* Restaurant header */}
      <div className="flex items-start justify-between gap-3 border-b border-border/50 px-4 py-3 bg-card/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">{group.restaurantName}</h3>
            <p className="text-[10px] text-muted-foreground">{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px] font-bold border-border/60">
          ₹{group.subtotal.toFixed(0)}
        </Badge>
      </div>
      {/* Items */}
      <CartItemList items={group.items} />
    </section>
  );
}
