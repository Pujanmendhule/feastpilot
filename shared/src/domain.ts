export type InputMode = "voice" | "chat";

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

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

export interface CartItem {
  id: string;
  restaurantId: string;
  menuItemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface RestaurantCartGroup {
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryEstimateMinutes: number;
}

export interface Cart {
  id: string;
  sessionId: string;
  restaurants: RestaurantCartGroup[];
  subtotal: number;
  estimatedFees: number;
  grandTotal: number;
  peopleCount: number;
  notes: string[];
}

export interface Session {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  cartId?: string;
}