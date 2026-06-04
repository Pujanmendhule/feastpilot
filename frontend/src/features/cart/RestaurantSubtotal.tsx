import { formatInr } from "@/features/session/sessionState";

type RestaurantSubtotalProps = {
  subtotal: number;
};

export function RestaurantSubtotal({ subtotal }: RestaurantSubtotalProps) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">Restaurant subtotal</p>
      <p className="mt-1 text-sm font-semibold">{formatInr(subtotal)}</p>
    </div>
  );
}
