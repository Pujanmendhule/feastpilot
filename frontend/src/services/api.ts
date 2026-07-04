const API_BASE_URL = "http://localhost:3001";

export interface ApiMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface ApiSession {
  id: string;
  cartId: string | null;
  selectedRestaurantId: string | null;
  awaitingRestaurantSelection: boolean;
  lastSearchResults: { id: string; name: string }[];
  lastViewedMenuItems: { id: string; name: string; restaurantId: string }[];
  lastReferencedMenuItemId: string | null;
  lastReferencedMenuItemName: string | null;
  messages: ApiMessage[];
  preferences: Record<string, any>;
  assumptions: Record<string, any>;
  activeRecommendationGoal: string | null;
  recommendationConstraints: Record<string, any> | null;
  excludedRecommendations: string[] | null;
  lastRecommendationResults: any[] | null;
  awaitingRecommendationRefinement: boolean;
  createdAt: string;
}

export interface ApiCartItem {
  restaurantId: string;
  restaurantName: string;
  menuItemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
  isVegetarian?: boolean;
}

export interface ApiCart {
  id: string;
  restaurants: { id: string; name: string }[];
  items: ApiCartItem[];
  subtotal: number;
}

export interface ApiRestaurant {
  id: string;
  name: string;
  cuisines: string[];
  rating: number;
  priceRange: "budget" | "mid" | "premium";
  deliveryEstimateMinutes: number;
  isAvailable: boolean;
  tags: string[];
}

export interface ApiMenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVegetarian: boolean;
  spiceLevel: number;
  servingEstimate: number;
  isAvailable: boolean;
  tags: string[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  const resJson = await response.json();
  if (!response.ok || !resJson.success) {
    throw new Error(resJson.error || `HTTP error! status: ${response.status}`);
  }

  return resJson.data as T;
}

export const SessionService = {
  async createSession(): Promise<ApiSession> {
    return request<ApiSession>("/api/sessions", {
      method: "POST",
    });
  },

  async getSession(sessionId: string): Promise<ApiSession> {
    return request<ApiSession>(`/api/sessions/${sessionId}`);
  },

  async deleteSession(sessionId: string): Promise<void> {
    await request<any>(`/api/sessions/${sessionId}`, {
      method: "DELETE",
    });
  },

  async attachCart(sessionId: string, cartId: string): Promise<ApiSession> {
    return request<ApiSession>(`/api/sessions/${sessionId}/cart`, {
      method: "POST",
      body: JSON.stringify({ cartId }),
    });
  },
};

export const ChatService = {
  async sendMessage(sessionId: string, message: string): Promise<{ response: string; sessionId: string }> {
    return request<{ response: string; sessionId: string }>("/api/conversation", {
      method: "POST",
      body: JSON.stringify({ sessionId, message }),
    });
  },
};

export const CartService = {
  async createCart(): Promise<ApiCart> {
    return request<ApiCart>("/api/carts", {
      method: "POST",
    });
  },

  async getCart(cartId: string): Promise<ApiCart> {
    return request<ApiCart>(`/api/carts/${cartId}`);
  },

  async addItem(cartId: string, restaurantId: string, menuItemId: string, quantity: number): Promise<any> {
    return request<any>(`/api/carts/${cartId}/items`, {
      method: "POST",
      body: JSON.stringify({ restaurantId, menuItemId, quantity }),
    });
  },

  async updateQuantity(cartId: string, menuItemId: string, quantity: number, restaurantId: string): Promise<any> {
    return request<any>(`/api/carts/${cartId}/items/${menuItemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity, restaurantId }),
    });
  },

  async removeItem(cartId: string, menuItemId: string, restaurantId: string): Promise<any> {
    return request<any>(
      `/api/carts/${cartId}/items/${menuItemId}?restaurantId=${encodeURIComponent(restaurantId)}`,
      { method: "DELETE" }
    );
  },
};

export const RestaurantService = {
  async getRestaurants(): Promise<ApiRestaurant[]> {
    return request<ApiRestaurant[]>("/api/restaurants");
  },

  async getMenu(restaurantId: string): Promise<{ restaurantId: string; items: ApiMenuItem[] }> {
    return request<{ restaurantId: string; items: ApiMenuItem[] }>(`/api/restaurants/${restaurantId}/menu`);
  },
};
