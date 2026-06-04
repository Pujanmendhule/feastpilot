export type MessageRole = "assistant" | "user" | "system";

export type MockMessage = {
  id: string;
  role: MessageRole;
  content: string;
  time: string;
  mode?: "voice" | "chat";
};

export type MockCartItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tags: string[];
  notes?: string;
};

export type MockRestaurantGroup = {
  id: string;
  name: string;
  cuisines: string[];
  deliveryWindow: string;
  deliveryFee: number;
  subtotal: number;
  items: MockCartItem[];
};

export type MockCart = {
  id: string;
  peopleCount: number;
  status: string;
  restaurantGroups: MockRestaurantGroup[];
  estimatedFees: number;
  grandTotal: number;
  assumptions: string[];
  warnings: string[];
};

export type MockSession = {
  id: string;
  status: string;
  mode: "voice" | "chat";
  updatedAt: string;
  messages: MockMessage[];
  cart: MockCart;
};

export const mockSession: MockSession = {
  id: "fp_mock_2406",
  status: "Planning",
  mode: "voice",
  updatedAt: "Today, 7:42 PM",
  messages: [
    {
      id: "m1",
      role: "system",
      content: "Mock session active. This cart is a planning draft, not a real order.",
      time: "7:38 PM",
    },
    {
      id: "m2",
      role: "user",
      content:
        "Plan dinner for four. Keep it vegetarian, add something spicy, and include dessert.",
      time: "7:39 PM",
      mode: "voice",
    },
    {
      id: "m3",
      role: "assistant",
      content:
        "I drafted a vegetarian multi-restaurant plan with North Indian mains, a spicy side, and dessert. The mock total is INR 1,610 before any real checkout.",
      time: "7:40 PM",
      mode: "chat",
    },
    {
      id: "m4",
      role: "user",
      content: "Add drinks and keep delivery under 45 minutes if possible.",
      time: "7:41 PM",
      mode: "chat",
    },
    {
      id: "m5",
      role: "assistant",
      content:
        "Added two lime sodas from the same dessert stop. The broadest mock delivery window is now 30 to 42 minutes across both restaurants.",
      time: "7:42 PM",
      mode: "chat",
    },
  ],
  cart: {
    id: "cart_mock_18",
    peopleCount: 4,
    status: "Mock draft",
    restaurantGroups: [
      {
        id: "r_north_01",
        name: "Kesar Kitchen",
        cuisines: ["North Indian", "Vegetarian"],
        deliveryWindow: "28-38 min",
        deliveryFee: 39,
        subtotal: 1180,
        items: [
          {
            id: "ci_1",
            name: "Paneer Tikka Platter",
            quantity: 1,
            unitPrice: 360,
            subtotal: 360,
            tags: ["veg", "starter"],
          },
          {
            id: "ci_2",
            name: "Dal Makhani",
            quantity: 1,
            unitPrice: 280,
            subtotal: 280,
            tags: ["veg", "main"],
          },
          {
            id: "ci_3",
            name: "Veg Biryani",
            quantity: 2,
            unitPrice: 230,
            subtotal: 460,
            tags: ["veg", "rice"],
          },
          {
            id: "ci_4",
            name: "Spicy Chole Side",
            quantity: 1,
            unitPrice: 80,
            subtotal: 80,
            tags: ["veg", "spicy"],
            notes: "Marked spicy in mock menu",
          },
        ],
      },
      {
        id: "r_sweet_02",
        name: "Mithai & More",
        cuisines: ["Desserts", "Beverages"],
        deliveryWindow: "30-42 min",
        deliveryFee: 29,
        subtotal: 300,
        items: [
          {
            id: "ci_5",
            name: "Gulab Jamun Box",
            quantity: 1,
            unitPrice: 180,
            subtotal: 180,
            tags: ["dessert", "veg"],
          },
          {
            id: "ci_6",
            name: "Fresh Lime Soda",
            quantity: 2,
            unitPrice: 60,
            subtotal: 120,
            tags: ["drink"],
          },
        ],
      },
    ],
    estimatedFees: 130,
    grandTotal: 1610,
    assumptions: [
      "Serving sizes are estimated for four people.",
      "Both restaurants are mock entries.",
      "Items are grouped by restaurant and may arrive separately.",
    ],
    warnings: [
      "No real Swiggy cart has been created.",
      "Prices and delivery windows are mock planning values.",
    ],
  },
};

export const formatInr = (amount: number) => `INR ${amount.toLocaleString("en-IN")}`;
