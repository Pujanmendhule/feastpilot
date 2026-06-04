import type { Cart } from "../types/cart";
import { cartService } from "../services/CartService";

export type CreateCartResult = {
  success: boolean;
  data: Cart;
  error?: string;
};

export async function createCart(): Promise<CreateCartResult> {
  const cart = cartService.createCart();

  return {
    success: true,
    data: cart,
  };
}
