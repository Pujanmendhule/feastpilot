import { Bike } from "lucide-react";

type RestaurantDeliveryEstimateProps = {
  deliveryFee: number;
  /** Delivery time in minutes (from ApiRestaurant.deliveryEstimateMinutes). */
  deliveryEstimateMinutes: number;
};

export function RestaurantDeliveryEstimate({
  deliveryFee,
  deliveryEstimateMinutes,
}: RestaurantDeliveryEstimateProps) {
  return (
    <div className="flex items-start gap-2">
      <Bike className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">Delivery estimate</p>
        <p className="mt-1 text-sm font-semibold">
          {deliveryEstimateMinutes} min / ₹{deliveryFee}
        </p>
      </div>
    </div>
  );
}
