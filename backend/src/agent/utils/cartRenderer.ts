import type { Cart } from "../../types/cart";
import { MockMenuService } from "../../services/MockMenuService";

const menuService = new MockMenuService();

function getItemName(restaurantId: string, menuItemId: string): string {
  return (
    menuService.getMenuItem(restaurantId, menuItemId)?.name ?? menuItemId
  );
}

export function formatCartLines(cart: Cart): string {
  return cart.items
    .map((item) => {
      const name = getItemName(item.restaurantId, item.menuItemId);
      return `• ${name} × ${item.quantity}`;
    })
    .join("\n");
}

export function formatCartSummary(cart: Cart): string {
  if (cart.items.length === 0) {
    return "Your cart is empty.";
  }

  return `Your cart:\n\n${formatCartLines(cart)}\n\nSubtotal: ₹${cart.subtotal}`;
}
