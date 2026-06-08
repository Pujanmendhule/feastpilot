import type { Cart } from "../types/cart";
import { cartService } from "../services/CartService";

export type GetCartInput = {
  cartId: string;
};

export type GetCartResult = {
  success: boolean;
  data: Cart | null;
  error?: string;
};

export async function getCart(
  input: GetCartInput
): Promise<GetCartResult> {
  const cartId = input.cartId.trim();

  if (!cartId) {
    return {
      success: false,
      data: null,
      error: "Cart ID is required",
    };
  }

  const cart = await cartService.getCart(cartId);

  if (!cart) {
    return {
      success: false,
      data: null,
      error: "Cart not found",
    };
  }

  return {
    success: true,
    data: cart,
  };
}
