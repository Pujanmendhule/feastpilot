import { type ApiCart } from "../../services/api";
import { RestaurantCartGroup } from "./RestaurantCartGroup";

type RestaurantCartGroupListProps = {
  cart: ApiCart;
};

export function RestaurantCartGroupList({ cart }: RestaurantCartGroupListProps) {
  // Group flat items by restaurantId
  const groupMap = new Map<string, { restaurantId: string; restaurantName: string; items: typeof cart.items; subtotal: number }>();

  for (const item of cart.items) {
    const existing = groupMap.get(item.restaurantId);
    if (existing) {
      existing.items.push(item);
      existing.subtotal += item.totalPrice;
    } else {
      groupMap.set(item.restaurantId, {
        restaurantId: item.restaurantId,
        restaurantName: item.restaurantName,
        items: [item],
        subtotal: item.totalPrice,
      });
    }
  }

  const groups = Array.from(groupMap.values());

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <RestaurantCartGroup group={group} key={group.restaurantId} />
      ))}
    </div>
  );
}
