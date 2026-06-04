import { Badge } from "@/components/ui/badge";
import type { MockRestaurantGroup } from "@/features/session/sessionState";

type RestaurantSummaryProps = {
  group: MockRestaurantGroup;
};

export function RestaurantSummary({ group }: RestaurantSummaryProps) {
  return (
    <div className="border-b border-border px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{group.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {group.cuisines.join(" / ")}
          </p>
        </div>
        <Badge variant="secondary">{group.deliveryWindow}</Badge>
      </div>
    </div>
  );
}
