import type { Restaurant } from "../types/restaurant";
import type { MockRestaurant } from "../data/mock/types";
import { MockRestaurantService } from "../services/MockRestaurantService";

const mockRestaurantService = new MockRestaurantService();

export type GetRestaurantInput = {
  restaurantId: string;
};

export type GetRestaurantResult = {
  success: boolean;
  data: Restaurant | null;
  error?: string;
};

function toRestaurant(mock: MockRestaurant): Restaurant {
  return {
    id: mock.id,
    name: mock.name,
    cuisine: mock.cuisines,
    rating: mock.rating,
    priceRange: mock.priceRange,
    deliveryEstimateMinutes: mock.deliveryEstimateMinutes,
    isAvailable: mock.isAvailable,
    tags: [],
  };
}

export async function getRestaurant(
  input: GetRestaurantInput
): Promise<GetRestaurantResult> {
  const restaurantId = input.restaurantId.trim();

  if (!restaurantId) {
    return {
      success: false,
      data: null,
      error: "Restaurant ID is required",
    };
  }

  const mock = mockRestaurantService.getRestaurantById(restaurantId);

  if (!mock) {
    return {
      success: false,
      data: null,
      error: "Restaurant not found",
    };
  }

  return {
    success: true,
    data: toRestaurant(mock),
  };
}
