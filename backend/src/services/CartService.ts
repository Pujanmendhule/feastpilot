import type { Cart } from "../types/cart";

function generateCartId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export class CartService {
  private readonly carts = new Map<string, Cart>();

  createCart(): Cart {
    const cart: Cart = {
      id: generateCartId(),
      restaurants: [],
      items: [],
      subtotal: 0,
      createdAt: new Date().toISOString(),
    };

    this.carts.set(cart.id, cart);
    return cart;
  }

  getCart(cartId: string): Cart | undefined {
    return this.carts.get(cartId);
  }
}

/** Shared in-memory cart store for tools and routes. */
export const cartService = new CartService();
