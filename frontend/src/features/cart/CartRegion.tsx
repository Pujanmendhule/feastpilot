import type { MockCart } from "@/features/session/sessionState";
import { CartAssumptions } from "./CartAssumptions";
import { CartHeader } from "./CartHeader";
import { CartTotals } from "./CartTotals";
import { CartValidationWarnings } from "./CartValidationWarnings";
import { RestaurantCartGroupList } from "./RestaurantCartGroupList";

type CartRegionProps = {
  cart: MockCart;
};

export function CartRegion({ cart }: CartRegionProps) {
  return (
    <aside className="flex min-h-0 w-full flex-col bg-background lg:w-[420px] xl:w-[460px]">
      <CartHeader cart={cart} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <RestaurantCartGroupList groups={cart.restaurantGroups} />
        <CartTotals cart={cart} />
        <CartAssumptions assumptions={cart.assumptions} />
        <CartValidationWarnings warnings={cart.warnings} />
      </div>
    </aside>
  );
}
