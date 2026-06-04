import menusJson from "../data/mock/menus.json";
import type { MockMenu } from "../data/mock/types";

const menus = menusJson as MockMenu[];

export class MockMenuService {
  getMenuByRestaurantId(
    restaurantId: string
  ) {
    return menus.find(
      (menu) =>
        menu.restaurantId === restaurantId
    );
  }

  getMenuItem(
    restaurantId: string,
    itemId: string
  ) {
    const menu =
      this.getMenuByRestaurantId(
        restaurantId
      );

    if (!menu) {
      return null;
    }

    return menu.items.find(
      (item) => item.id === itemId
    );
  }

  getVegetarianItems(
    restaurantId: string
  ) {
    const menu =
      this.getMenuByRestaurantId(
        restaurantId
      );

    if (!menu) {
      return [];
    }

    return menu.items.filter(
      (item) => item.isVegetarian
    );
  }

  getAvailableItems(
    restaurantId: string
  ) {
    const menu =
      this.getMenuByRestaurantId(
        restaurantId
      );

    if (!menu) {
      return [];
    }

    return menu.items.filter(
      (item) => item.isAvailable
    );
  }
}
