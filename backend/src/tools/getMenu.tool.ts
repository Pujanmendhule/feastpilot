import type { MenuItem } from "../types/menuItem";
import type { MockMenuItem } from "../data/mock/types";
import { MockMenuService } from "../services/MockMenuService";

const mockMenuService = new MockMenuService();

export type GetMenuInput = {
  restaurantId: string;
};

export type GetMenuResult = {
  success: boolean;
  data: MenuItem[];
  error?: string;
};

function toMenuItem(
  restaurantId: string,
  mock: MockMenuItem
): MenuItem {
  return {
    id: mock.id,
    restaurantId,
    name: mock.name,
    description: "",
    price: mock.price,
    category: mock.category,
    isVegetarian: mock.isVegetarian,
    spiceLevel: 0,
    servingEstimate: mock.servingEstimate,
    isAvailable: mock.isAvailable,
    tags: [],
  };
}

export async function getMenu(
  input: GetMenuInput
): Promise<GetMenuResult> {
  const restaurantId = input.restaurantId.trim();

  if (!restaurantId) {
    return {
      success: false,
      data: [],
      error: "Restaurant ID is required",
    };
  }

  const menu = mockMenuService.getMenuByRestaurantId(restaurantId);

  if (!menu) {
    return {
      success: false,
      data: [],
      error: "Menu not found",
    };
  }

  return {
    success: true,
    data: menu.items.map((item) =>
      toMenuItem(menu.restaurantId, item)
    ),
  };
}
