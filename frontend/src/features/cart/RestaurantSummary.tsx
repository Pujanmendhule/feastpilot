import { Badge } from "@/components/ui/badge";

/** Restaurant info as returned by ApiCart.restaurants[] */
type ApiRestaurantSummary = {
  id: string;
  name: string;
};

type RestaurantSummaryProps = {
  restaurant: ApiRestaurantSummary;
};

export function RestaurantSummary({ restaurant }: RestaurantSummaryProps) {
  return (
    <div className="border-b border-border px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{restaurant.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground font-mono">
            {restaurant.id}
          </p>
        </div>
        <Badge variant="secondary">Restaurant</Badge>
      </div>
    </div>
  );
}
