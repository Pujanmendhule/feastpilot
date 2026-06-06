import type { Cart } from "../../types/cart";

export type SelectRestaurantResult = {
  success: boolean;
  data: { id: string; name: string } | null;
  error?: string;
};

export type CartAction =
  | "add"
  | "addAnother"
  | "remove"
  | "setQuantity"
  | "view";

export type CartOperationResult = {
  success: boolean;
  action: CartAction;
  data: Cart | null;
  itemName?: string;
  quantity?: number;
  error?: string;
};
