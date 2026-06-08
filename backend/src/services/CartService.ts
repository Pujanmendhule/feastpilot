import type { Cart, CartItem } from "../types/cart";
import { MockMenuService } from "./MockMenuService";
import { prisma } from "../db/prisma";
import type { Cart as PrismaCart, CartItem as PrismaCartItem } from "@prisma/client";

function generateCartId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

type PrismaCartWithItems = PrismaCart & { items: PrismaCartItem[] };

/** Map a Prisma Cart row (with items) to the in-memory Cart interface. */
function toCart(row: PrismaCartWithItems): Cart {
  const items: CartItem[] = row.items.map((i) => ({
    restaurantId: i.restaurantId,
    menuItemId: i.menuItemId,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
  }));

  const restaurants = [...new Set(items.map((i) => i.restaurantId))];

  return {
    id: row.id,
    restaurants,
    items,
    subtotal: row.subtotal,
    createdAt: row.createdAt.toISOString(),
  };
}

export class CartService {
  private readonly menuService = new MockMenuService();

  async createCart(): Promise<Cart> {
    const id = generateCartId();
    const row = await prisma.cart.create({
      data: { id },
      include: { items: true },
    });
    return toCart(row);
  }

  async getCart(cartId: string): Promise<Cart | undefined> {
    const row = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    });
    return row ? toCart(row) : undefined;
  }

  async addItem(
    cartId: string,
    restaurantId: string,
    menuItemId: string,
    quantity: number
  ): Promise<Cart> {
    const cart = await prisma.cart.findUnique({ where: { id: cartId } });
    if (!cart) {
      throw new Error("Cart not found");
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Quantity must be greater than zero");
    }

    const menuItem = this.menuService.getMenuItem(restaurantId, menuItemId);
    if (!menuItem) {
      throw new Error("Menu item not found");
    }

    // Upsert: if item already exists, increment quantity; otherwise create it
    await prisma.cartItem.upsert({
      where: {
        cartId_restaurantId_menuItemId: {
          cartId,
          restaurantId,
          menuItemId,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        cartId,
        restaurantId,
        menuItemId,
        quantity,
        unitPrice: menuItem.price,
      },
    });

    // Recalculate subtotal
    const allItems = await prisma.cartItem.findMany({
      where: { cartId },
    });
    const subtotal = allItems.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0
    );
    const updated = await prisma.cart.update({
      where: { id: cartId },
      data: { subtotal },
      include: { items: true },
    });
    return toCart(updated);
  }

  async setItemQuantity(
    cartId: string,
    restaurantId: string,
    menuItemId: string,
    quantity: number
  ): Promise<Cart> {
    const cart = await prisma.cart.findUnique({ where: { id: cartId } });
    if (!cart) {
      throw new Error("Cart not found");
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Quantity must be greater than zero");
    }

    const existing = await prisma.cartItem.findUnique({
      where: {
        cartId_restaurantId_menuItemId: {
          cartId,
          restaurantId,
          menuItemId,
        },
      },
    });
    if (!existing) {
      throw new Error("Item not in cart");
    }

    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity },
    });

    // Recalculate subtotal
    const allItems = await prisma.cartItem.findMany({
      where: { cartId },
    });
    const subtotal = allItems.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0
    );
    const updated = await prisma.cart.update({
      where: { id: cartId },
      data: { subtotal },
      include: { items: true },
    });
    return toCart(updated);
  }

  async removeItem(
    cartId: string,
    restaurantId: string,
    menuItemId: string
  ): Promise<Cart> {
    const cart = await prisma.cart.findUnique({ where: { id: cartId } });
    if (!cart) {
      throw new Error("Cart not found");
    }

    const existing = await prisma.cartItem.findUnique({
      where: {
        cartId_restaurantId_menuItemId: {
          cartId,
          restaurantId,
          menuItemId,
        },
      },
    });
    if (!existing) {
      throw new Error("Item not in cart");
    }

    await prisma.cartItem.delete({
      where: { id: existing.id },
    });

    // Recalculate subtotal
    const allItems = await prisma.cartItem.findMany({
      where: { cartId },
    });
    const subtotal = allItems.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0
    );
    const updated = await prisma.cart.update({
      where: { id: cartId },
      data: { subtotal },
      include: { items: true },
    });
    return toCart(updated);
  }
}

/** Shared cart store for tools and routes. */
export const cartService = new CartService();
