import restaurantsJson from "../data/mock/restaurants.json";
import type { MockRestaurant } from "../data/mock/types";

const restaurants = restaurantsJson as MockRestaurant[];

export class MockRestaurantService {
  getRestaurantById(restaurantId: string) {
    return restaurants.find(
      (restaurant) => restaurant.id === restaurantId
    );
  }

  getAvailableRestaurants() {
    return restaurants.filter(
      (restaurant) => restaurant.isAvailable
    );
  }

  searchRestaurants(query: string) {
    const normalized = query.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const nameMatch = restaurant.name
        .toLowerCase()
        .includes(normalized);
      const cuisineMatch = restaurant.cuisines.some((cuisine) =>
        cuisine.toLowerCase().includes(normalized)
      );

      return nameMatch || cuisineMatch;
    });
  }
}
