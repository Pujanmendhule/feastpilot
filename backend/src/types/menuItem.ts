/** Aligns with `MenuItem` in `shared/src/domain.ts`. */
export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVegetarian: boolean;
  spiceLevel: 0 | 1 | 2 | 3 | 4 | 5;
  servingEstimate: number;
  isAvailable: boolean;
  tags: string[];
}
