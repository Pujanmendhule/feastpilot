/** Aligns with `Restaurant` in `shared/src/domain.ts`. */
export interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  rating: number;
  priceRange: "budget" | "mid" | "premium";
  deliveryEstimateMinutes: number;
  isAvailable: boolean;
  tags: string[];
}
