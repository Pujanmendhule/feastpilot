/** Types for mock JSON under `src/data/mock/` (shape matches restaurants.json / menus.json). */

export type MockPriceRange = "budget" | "mid" | "premium";

export interface MockRestaurant {
  id: string;
  name: string;
  cuisines: string[];
  rating: number;
  priceRange: MockPriceRange;
  deliveryEstimateMinutes: number;
  isAvailable: boolean;
}

export interface MockMenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isVegetarian: boolean;
  isAvailable: boolean;
  servingEstimate: number;
}

export interface MockMenu {
  restaurantId: string;
  items: MockMenuItem[];
}
