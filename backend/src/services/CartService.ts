import type { Cart, CartItem } from "../types/cart";
import { MockMenuService } from "./MockMenuService";

function generateCartId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function recalculateSubtotal(items: CartItem[]): number {
  return items.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0
  );
}

function findCartLineIndex(
  items: CartItem[],
  restaurantId: string,
  menuItemId: string
): number {
  return items.findIndex(
    (item) =>
      item.restaurantId === restaurantId &&
      item.menuItemId === menuItemId
  );
}

export class CartService {
  private readonly carts = new Map<string, Cart>();
  private readonly menuService = new MockMenuService();

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

  addItem(
    cartId: string,
    restaurantId: string,
    menuItemId: string,
    quantity: number
  ): Cart {
    const cart = this.carts.get(cartId);
    if (!cart) {
      throw new Error("Cart not found");
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Quantity must be greater than zero");
    }

    const menuItem = this.menuService.getMenuItem(
      restaurantId,
      menuItemId
    );
    if (!menuItem) {
      throw new Error("Menu item not found");
    }

    const existingIndex = findCartLineIndex(
      cart.items,
      restaurantId,
      menuItemId
    );

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({
        restaurantId,
        menuItemId,
        quantity,
        unitPrice: menuItem.price,
      });
    }

    if (!cart.restaurants.includes(restaurantId)) {
      cart.restaurants.push(restaurantId);
    }

    cart.subtotal = recalculateSubtotal(cart.items);
    this.carts.set(cart.id, cart);

    return cart;
  }
}

/** Shared in-memory cart store for tools and routes. */
export const cartService = new CartService();
