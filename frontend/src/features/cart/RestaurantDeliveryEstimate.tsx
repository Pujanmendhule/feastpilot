import { Bike } from "lucide-react";
import { formatInr } from "@/features/session/sessionState";

type RestaurantDeliveryEstimateProps = {
  deliveryFee: number;
  deliveryWindow: string;
};

export function RestaurantDeliveryEstimate({
  deliveryFee,
  deliveryWindow,
}: RestaurantDeliveryEstimateProps) {
  return (
    <div className="flex items-start gap-2">
      <Bike className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">Delivery estimate</p>
        <p className="mt-1 text-sm font-semibold">
          {deliveryWindow} / {formatInr(deliveryFee)}
        </p>
      </div>
    </div>
  );
}
