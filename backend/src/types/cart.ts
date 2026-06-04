export interface CartItem {
  restaurantId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
}

export interface Cart {
  id: string;
  restaurants: string[];
  items: CartItem[];
  subtotal: number;
  createdAt: string;
}
