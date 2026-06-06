import type { Cart } from "../types/cart";
import { cartService } from "../services/CartService";

export type SetCartItemQuantityInput = {
  cartId: string;
  restaurantId: string;
  menuItemId: string;
  quantity: number;
};

export type SetCartItemQuantityResult = {
  success: boolean;
  data: Cart | null;
  error?: string;
};

export async function setCartItemQuantity(
  input: SetCartItemQuantityInput
): Promise<SetCartItemQuantityResult> {
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

  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    return {
      success: false,
      data: null,
      error: "Quantity must be greater than zero",
    };
  }

  try {
    const cart = cartService.setItemQuantity(
      cartId,
      restaurantId,
      menuItemId,
      input.quantity
    );

    return {
      success: true,
      data: cart,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update item quantity";

    return {
      success: false,
      data: null,
      error: message,
    };
  }
}
