import type { MockRestaurantGroup } from "@/features/session/sessionState";
import { CartItemList } from "./CartItemList";
import { RestaurantDeliveryEstimate } from "./RestaurantDeliveryEstimate";
import { RestaurantSubtotal } from "./RestaurantSubtotal";
import { RestaurantSummary } from "./RestaurantSummary";

type RestaurantCartGroupProps = {
  group: MockRestaurantGroup;
};

export function RestaurantCartGroup({ group }: RestaurantCartGroupProps) {
  return (
    <section className="rounded-md border border-border bg-card shadow-sm">
      <RestaurantSummary group={group} />
      <CartItemList items={group.items} />
      <div className="grid gap-2 border-t border-border px-4 py-3 sm:grid-cols-2">
        <RestaurantSubtotal subtotal={group.subtotal} />
        <RestaurantDeliveryEstimate
          deliveryFee={group.deliveryFee}
          deliveryWindow={group.deliveryWindow}
        />
      </div>
    </section>
  );
}
