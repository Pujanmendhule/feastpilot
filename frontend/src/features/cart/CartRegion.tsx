import { useSessionContext } from "../session/SessionContext";
import { CartHeader } from "./CartHeader";
import { CartTotals } from "./CartTotals";
import { CartAssumptions } from "./CartAssumptions";
import { RestaurantCartGroupList } from "./RestaurantCartGroupList";
import { ShoppingCart, MessageCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CartRegion() {
  const { cart, isCartLoading } = useSessionContext();

  return (
    <aside className="flex min-h-0 w-full flex-col border-l border-border/50 bg-background/60 lg:w-[400px] xl:w-[440px] shrink-0">
      {/* Header */}
      {cart ? (
        <CartHeader cart={cart} />
      ) : (
        <header className="border-b border-border/60 px-4 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card/80 border border-border/60">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Your Cart</h2>
              <p className="text-[10px] text-muted-foreground font-medium">Empty</p>
            </div>
          </div>
        </header>
      )}

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {isCartLoading && !cart ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3"
            >
              <RefreshCw className="h-8 w-8 text-primary/50 animate-spin" />
              <p className="text-sm text-muted-foreground font-medium">Loading cart…</p>
            </motion.div>
          ) : cart && cart.items.length > 0 ? (
            <motion.div
              key="cart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <RestaurantCartGroupList cart={cart} />
              <CartTotals cart={cart} />
              <CartAssumptions />

              {/* Checkout placeholder */}
              <div className="mt-4">
                <button
                  disabled
                  className="w-full rounded-xl bg-primary/20 border border-primary/30 py-3 text-sm font-extrabold text-primary/60 cursor-not-allowed"
                  title="Checkout coming soon"
                >
                  Checkout (Coming Soon)
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[280px] gap-4 text-center px-4"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card/80 border border-border/60">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">Cart is empty</p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
                  Chat with FeastPilot to get personalized food recommendations added here.
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                <MessageCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-[11px] font-semibold text-primary">
                  Try: "Suggest lunch for 2"
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cart loading overlay (for updates) */}
      {isCartLoading && cart && (
        <div className="border-t border-border/50 bg-card/60 px-4 py-2 flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin" />
          <span className="text-[11px] text-muted-foreground font-medium">Updating cart…</span>
        </div>
      )}
    </aside>
  );
}
