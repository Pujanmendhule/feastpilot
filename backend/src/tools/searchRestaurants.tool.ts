import type { Restaurant } from "../types/restaurant";
import type { MockRestaurant } from "../data/mock/types";
import { MockRestaurantService } from "../services/MockRestaurantService";

const mockRestaurantService = new MockRestaurantService();

export type SearchRestaurantsInput = {
  query: string;
};

export type SearchRestaurantsResult = {
  success: boolean;
  data: Restaurant[];
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

export async function searchRestaurants(
  input: SearchRestaurantsInput
): Promise<SearchRestaurantsResult> {
  const query = input.query.trim();

  if (!query) {
    return {
      success: false,
      data: [],
      error: "Query is required",
    };
  }

  const matches = mockRestaurantService.searchRestaurants(query);

  return {
    success: true,
    data: matches.map(toRestaurant),
  };
}
