import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  SessionService,
  ChatService,
  CartService,
  type ApiSession,
  type ApiCart,
  type ApiMessage,
} from "../../services/api";

export type SessionContextType = {
  session: ApiSession | null;
  cart: ApiCart | null;
  isLoading: boolean;
  isCartLoading: boolean;
  error: string | null;
  connectionStatus: "connected" | "disconnected" | "connecting";
  mode: "chat" | "voice";
  initSession: (sessionId?: string) => Promise<string>;
  sendMessage: (messageText: string) => Promise<void>;
  addRecommendedItemToCart: (restaurantId: string, menuItemId: string, quantity: number) => Promise<void>;
  updateCartItemQty: (restaurantId: string, menuItemId: string, quantity: number) => Promise<void>;
  removeCartItem: (restaurantId: string, menuItemId: string) => Promise<void>;
  clearSession: () => Promise<void>;
  setMode: (mode: "chat" | "voice") => void;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ApiSession | null>(null);
  const [cart, setCart] = useState<ApiCart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("connecting");
  const [mode, setModeState] = useState<"chat" | "voice">("chat");

  // Keep a cached map of item names to display properly during loading states
  const [itemNamesCache, setItemNamesCache] = useState<Record<string, string>>({});

  const setMode = useCallback((newMode: "chat" | "voice") => {
    setModeState(newMode);
    localStorage.setItem("fp_mode", newMode);
  }, []);

  // Fetch complete cart details
  const fetchCartDetails = useCallback(async (cartId: string) => {
    try {
      setIsCartLoading(true);
      const cartData = await CartService.getCart(cartId);
      setCart(cartData);

      // Cache item names
      const cacheUpdate: Record<string, string> = {};
      cartData.items.forEach((item) => {
        cacheUpdate[item.menuItemId] = item.itemName;
      });
      setItemNamesCache((prev) => ({ ...prev, ...cacheUpdate }));
    } catch (err) {
      console.error("Failed to fetch cart details:", err);
      // Don't set global error to avoid disrupting chat
    } finally {
      setIsCartLoading(false);
    }
  }, []);

  // Initialize or restore session
  const initSession = useCallback(async (existingId?: string): Promise<string> => {
    setConnectionStatus("connecting");
    setError(null);
    try {
      let activeSession: ApiSession;
      const cachedId = existingId || localStorage.getItem("fp_session_id");

      if (cachedId) {
        try {
          activeSession = await SessionService.getSession(cachedId);
        } catch (err) {
          console.warn("Cached session invalid, creating a new one...", err);
          activeSession = await SessionService.createSession();
        }
      } else {
        activeSession = await SessionService.createSession();
      }

      setSession(activeSession);
      localStorage.setItem("fp_session_id", activeSession.id);

      // Restore mode
      const savedMode = localStorage.getItem("fp_mode") as "chat" | "voice";
      if (savedMode === "chat" || savedMode === "voice") {
        setModeState(savedMode);
      }

      // If cart exists, load it
      if (activeSession.cartId) {
        await fetchCartDetails(activeSession.cartId);
      } else {
        setCart(null);
      }

      setConnectionStatus("connected");
      return activeSession.id;
    } catch (err: any) {
      console.error("Session initialization failed:", err);
      setError("Unable to connect to FeastPilot services. Please check if backend is running.");
      setConnectionStatus("disconnected");
      throw err;
    }
  }, [fetchCartDetails]);

  // Periodic health & sync connection check
  useEffect(() => {
    const handleHealthCheck = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/health");
        if (response.ok) {
          setConnectionStatus("connected");
        } else {
          setConnectionStatus("disconnected");
        }
      } catch {
        setConnectionStatus("disconnected");
      }
    };

    const interval = setInterval(handleHealthCheck, 10000);
    return () => clearInterval(interval);
  }, []);

  // Send a chat message
  const sendMessage = useCallback(async (messageText: string) => {
    if (!session) return;
    setError(null);
    setIsLoading(true);

    const tempMessageId = `temp_${Date.now()}`;
    const userMsg: ApiMessage = {
      id: tempMessageId,
      role: "user",
      content: messageText,
      createdAt: new Date().toISOString(),
    };

    // Optimistically update conversation
    setSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, userMsg],
      };
    });

    try {
      // Send chat
      await ChatService.sendMessage(session.id, messageText);

      // Sync the whole session state to get final messages, recommendation results, selection states
      const updatedSession = await SessionService.getSession(session.id);
      setSession(updatedSession);

      // If session now has a cart, update it
      if (updatedSession.cartId) {
        await fetchCartDetails(updatedSession.cartId);
      }
    } catch (err: any) {
      console.error("Failed to send message:", err);
      setError("Message failed to send. Please check your network connection.");
      // Rollback optimistic message if error
      setSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.filter((m) => m.id !== tempMessageId),
        };
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, fetchCartDetails]);

  // Helper to ensure cart exists, returning its ID
  const getOrCreatedCartId = async (activeSession: ApiSession): Promise<string> => {
    if (activeSession.cartId) {
      return activeSession.cartId;
    }
    setIsCartLoading(true);
    try {
      const newCart = await CartService.createCart();
      const updatedSession = await SessionService.attachCart(activeSession.id, newCart.id);
      setSession(updatedSession);
      return newCart.id;
    } finally {
      setIsCartLoading(false);
    }
  };

  // Add item to cart directly from UI cards
  const addRecommendedItemToCart = useCallback(async (restaurantId: string, menuItemId: string, quantity: number) => {
    if (!session) return;
    setError(null);
    setIsCartLoading(true);
    try {
      const cartId = await getOrCreatedCartId(session);
      await CartService.addItem(cartId, restaurantId, menuItemId, quantity);
      await fetchCartDetails(cartId);
    } catch (err: any) {
      console.error("Direct add to cart failed:", err);
      setError("Unable to add item to cart directly.");
    } finally {
      setIsCartLoading(false);
    }
  }, [session, fetchCartDetails]);

  // Update item quantity directly from UI sidebar
  const updateCartItemQty = useCallback(async (restaurantId: string, menuItemId: string, quantity: number) => {
    if (!session || !session.cartId) return;
    setError(null);
    setIsCartLoading(true);
    try {
      if (quantity <= 0) {
        await CartService.removeItem(session.cartId, menuItemId, restaurantId);
      } else {
        await CartService.updateQuantity(session.cartId, menuItemId, quantity, restaurantId);
      }
      await fetchCartDetails(session.cartId);
    } catch (err: any) {
      console.error("Direct update quantity failed:", err);
      setError("Unable to update item quantity.");
    } finally {
      setIsCartLoading(false);
    }
  }, [session, fetchCartDetails]);

  // Remove item from cart directly from UI sidebar
  const removeCartItem = useCallback(async (restaurantId: string, menuItemId: string) => {
    if (!session || !session.cartId) return;
    setError(null);
    setIsCartLoading(true);
    try {
      await CartService.removeItem(session.cartId, menuItemId, restaurantId);
      await fetchCartDetails(session.cartId);
    } catch (err: any) {
      console.error("Direct remove item failed:", err);
      setError("Unable to remove item from cart.");
    } finally {
      setIsCartLoading(false);
    }
  }, [session, fetchCartDetails]);

  const clearSession = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      if (session) {
        await SessionService.deleteSession(session.id);
      }
    } catch (err) {
      console.warn("Delete session error:", err);
    }
    localStorage.removeItem("fp_session_id");
    setSession(null);
    setCart(null);
    setIsLoading(false);
    // Create a fresh session after clearing
    try {
      await initSession();
    } catch (err) {
      console.error("Failed to create new session after clear:", err);
    }
  }, [session, initSession]);

  return (
    <SessionContext.Provider
      value={{
        session,
        cart,
        isLoading,
        isCartLoading,
        error,
        connectionStatus,
        mode,
        initSession,
        sendMessage,
        addRecommendedItemToCart,
        updateCartItemQty,
        removeCartItem,
        clearSession,
        setMode,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
