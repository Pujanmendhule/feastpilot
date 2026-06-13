import { Router } from "express";
import { cartService } from "../services/CartService";
import { MockRestaurantService } from "../services/MockRestaurantService";
import { MockMenuService } from "../services/MockMenuService";

export const cartRouter = Router();
const restaurantService = new MockRestaurantService();
const menuService = new MockMenuService();

// POST /api/carts
cartRouter.post("/api/carts", async (req, res, next) => {
  try {
    const cart = await cartService.createCart();
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
});

// GET /api/restaurants
cartRouter.get("/api/restaurants", (req, res, next) => {
  try {
    const list = restaurantService.getAvailableRestaurants();
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
});

// GET /api/restaurants/:restaurantId/menu
cartRouter.get("/api/restaurants/:restaurantId/menu", (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const menu = menuService.getMenuByRestaurantId(restaurantId);
    if (!menu) {
      res.status(404).json({ success: false, error: "Restaurant menu not found" });
      return;
    }
    res.json({ success: true, data: menu });
  } catch (error) {
    next(error);
  }
});

// GET /api/carts/:cartId
cartRouter.get("/api/carts/:cartId", async (req, res, next) => {
  try {
    const { cartId } = req.params;
    const cart = await cartService.getCart(cartId);

    if (!cart) {
      res.status(404).json({ success: false, error: "Cart not found" });
      return;
    }

    // Enrich the items with menu metadata and restaurant names
    const enrichedItems = cart.items.map((item) => {
      const menuItem = menuService.getMenuItem(item.restaurantId, item.menuItemId);
      const restaurant = restaurantService.getRestaurantById(item.restaurantId);

      return {
        restaurantId: item.restaurantId,
        restaurantName: restaurant?.name ?? "Unknown Restaurant",
        menuItemId: item.menuItemId,
        itemName: menuItem?.name ?? item.menuItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        description: "",
        isVegetarian: menuItem?.isVegetarian ?? false,
      };
    });

    res.json({
      success: true,
      data: {
        id: cart.id,
        restaurants: cart.restaurants.map((id) => {
          const r = restaurantService.getRestaurantById(id);
          return { id, name: r?.name ?? "Unknown Restaurant" };
        }),
        items: enrichedItems,
        subtotal: cart.subtotal,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/carts/:cartId/items
cartRouter.post("/api/carts/:cartId/items", async (req, res, next) => {
  try {
    const { cartId } = req.params;
    const { restaurantId, menuItemId, quantity } = req.body;

    if (!restaurantId || !menuItemId || typeof quantity !== "number" || quantity <= 0) {
      res.status(400).json({ success: false, error: "restaurantId, menuItemId, and quantity > 0 are required" });
      return;
    }

    const updatedCart = await cartService.addItem(cartId, restaurantId, menuItemId, quantity);
    res.json({ success: true, data: updatedCart });
  } catch (error) {
    next(error);
  }
});

// PUT /api/carts/:cartId/items/:menuItemId
cartRouter.put("/api/carts/:cartId/items/:menuItemId", async (req, res, next) => {
  try {
    const { cartId, menuItemId } = req.params;
    const { quantity, restaurantId } = req.body;

    if (!restaurantId || typeof quantity !== "number" || quantity <= 0) {
      res.status(400).json({ success: false, error: "restaurantId and quantity > 0 are required" });
      return;
    }

    const updatedCart = await cartService.setItemQuantity(cartId, restaurantId, menuItemId, quantity);
    res.json({ success: true, data: updatedCart });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/carts/:cartId/items/:menuItemId
cartRouter.delete("/api/carts/:cartId/items/:menuItemId", async (req, res, next) => {
  try {
    const { cartId, menuItemId } = req.params;
    const { restaurantId } = req.body || req.query;

    const finalRestaurantId = restaurantId || req.query.restaurantId;

    if (!finalRestaurantId || typeof finalRestaurantId !== "string") {
      res.status(400).json({ success: false, error: "restaurantId is required in body or query parameters" });
      return;
    }

    const updatedCart = await cartService.removeItem(cartId, finalRestaurantId, menuItemId);
    res.json({ success: true, data: updatedCart });
  } catch (error) {
    next(error);
  }
});
