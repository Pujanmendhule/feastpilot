/**
 * DEVELOPMENT ONLY — do not enable in production.
 *
 * These routes exercise cart tools against mock data for local debugging.
 * Remove this module or gate registration behind NODE_ENV === "development"
 * before shipping.
 */

import { Router } from "express";
import { createCart } from "../tools/createCart.tool";
import { getCart } from "../tools/getCart.tool";
import { updateCart } from "../tools/updateCart.tool";

/** Stable mock menu IDs (see menus.json). Dev fixture only — not menu business logic. */
const CART_TEST_ADDITIONS = [
  {
    restaurantId: "behrouz_biryani",
    menuItemId: "bb_3",
    quantity: 1,
  },
  {
    restaurantId: "sweet_truth",
    menuItemId: "st_3",
    quantity: 1,
  },
  {
    restaurantId: "chaayos",
    menuItemId: "ch_1",
    quantity: 1,
  },
] as const;

/**
 * DEVELOPMENT ONLY — multi-restaurant cart smoke test via tools (not services).
 */
async function runCartTestFlow() {
  const created = await createCart();
  if (!created.success || !created.data) {
    return {
      success: false as const,
      error: created.error ?? "Failed to create cart",
    };
  }

  const cartId = created.data.id;

  for (const item of CART_TEST_ADDITIONS) {
    const updated = await updateCart({
      cartId,
      restaurantId: item.restaurantId,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
    });

    if (!updated.success || !updated.data) {
      return {
        success: false as const,
        error: updated.error ?? "Failed to update cart",
      };
    }
  }

  const retrieved = await getCart({ cartId });
  if (!retrieved.success || !retrieved.data) {
    return {
      success: false as const,
      error: retrieved.error ?? "Failed to retrieve cart",
    };
  }

  return {
    success: true as const,
    data: retrieved.data,
  };
}

export const devRouter = Router();

/**
 * GET /api/dev/cart-test
 *
 * DEVELOPMENT ONLY — remove or disable in production.
 */
devRouter.get("/api/dev/cart-test", async (_req, res) => {
  try {
    const result = await runCartTestFlow();

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.json(result.data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Cart test failed";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});
