import type { Cart } from "../types/cart";
import { cartService } from "../services/CartService";

export type RemoveFromCartInput = {
  cartId: string;
  restaurantId: string;
  menuItemId: string;
};

export type RemoveFromCartResult = {
  success: boolean;
  data: Cart | null;
  error?: string;
};

export async function removeFromCart(
  input: RemoveFromCartInput
): Promise<RemoveFromCartResult> {
  const cartId = input.cartId.trim();
  const restaurantId = input.restaurantId.trim();
  const menuItemId = input.menuItemId.trim();

  if (!cartId || !restaurantId || !menuItemId) {
    return {
      success: false,
      data: null,
      error: "Cart ID, restaurant ID, and menu item ID are required",
    };
  }

  try {
    const cart = cartService.removeItem(
      cartId,
      restaurantId,
      menuItemId
    );

    return {
      success: true,
      data: cart,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to remove item";

    return {
      success: false,
      data: null,
      error: message,
    };
  }
}
