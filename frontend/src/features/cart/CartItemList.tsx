import { type ApiCartItem } from "../../services/api";
import { CartItemRow } from "./CartItemRow";
import { AnimatePresence } from "framer-motion";

type CartItemListProps = {
  items: ApiCartItem[];
};

export function CartItemList({ items }: CartItemListProps) {
  return (
    <div className="divide-y divide-border/60">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <CartItemRow item={item} key={`${item.restaurantId}-${item.menuItemId}`} />
        ))}
      </AnimatePresence>
    </div>
  );
}
