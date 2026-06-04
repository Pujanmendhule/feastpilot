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
}
