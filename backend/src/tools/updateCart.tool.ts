import type { Cart } from "../types/cart";
import { cartService } from "../services/CartService";

export type UpdateCartInput = {
  cartId: string;
  restaurantId: string;
  menuItemId: string;
  quantity: number;
};

export type UpdateCartResult = {
  success: boolean;
  data: Cart | null;
  error?: string;
};

export async function updateCart(
  input: UpdateCartInput
): Promise<UpdateCartResult> {
  const cartId = input.cartId.trim();
  const restaurantId = input.restaurantId.trim();
  const menuItemId = input.menuItemId.trim();

  if (!cartId) {
    return {
      success: false,
      data: null,
      error: "Cart ID is required",
    };
  }

  if (!restaurantId) {
    return {
      success: false,
      data: null,
      error: "Restaurant ID is required",
    };
  }

  if (!menuItemId) {
    return {
      success: false,
      data: null,
      error: "Menu item ID is required",
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
    const cart = cartService.addItem(
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
        : "Failed to update cart";

    return {
      success: false,
      data: null,
      error: message,
    };
  }
}
