import type { MockCartItem } from "@/features/session/sessionState";
import { CartItemRow } from "./CartItemRow";

type CartItemListProps = {
  items: MockCartItem[];
};

export function CartItemList({ items }: CartItemListProps) {
  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <CartItemRow item={item} key={item.id} />
      ))}
    </div>
  );
}
