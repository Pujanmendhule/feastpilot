import { useSessionContext } from "../session/SessionContext";
import { type ApiCartItem } from "../../services/api";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type CartItemRowProps = {
  item: ApiCartItem;
};

export function CartItemRow({ item }: CartItemRowProps) {
  const { updateCartItemQty, removeCartItem, isCartLoading } = useSessionContext();
  const [isPending, setIsPending] = useState(false);

  const handleQuantityChange = async (delta: number) => {
    setIsPending(true);
    try {
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        await removeCartItem(item.restaurantId, item.menuItemId);
      } else {
        await updateCartItemQty(item.restaurantId, item.menuItemId, newQty);
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleRemove = async () => {
    setIsPending(true);
    try {
      await removeCartItem(item.restaurantId, item.menuItemId);
    } finally {
      setIsPending(false);
    }
  };

  const isDisabled = isPending || isCartLoading;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="px-4 py-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${item.isVegetarian ? "bg-emerald-500" : "bg-red-500"}`}
              title={item.isVegetarian ? "Veg" : "Non-Veg"}
            />
            <p className="text-sm font-semibold text-foreground leading-tight">{item.itemName}</p>
          </div>
          {item.description && (
            <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">{item.description}</p>
          )}
          <div className="mt-2 flex items-center gap-1.5">
            {/* Minus */}
            <Button
              size="icon"
              variant="outline"
              disabled={isDisabled}
              onClick={() => handleQuantityChange(-1)}
              className="h-6 w-6 rounded-md border-border/60 bg-background/50 text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="min-w-[24px] text-center text-xs font-bold text-foreground">
              {item.quantity}
            </span>
            {/* Plus */}
            <Button
              size="icon"
              variant="outline"
              disabled={isDisabled}
              onClick={() => handleQuantityChange(1)}
              className="h-6 w-6 rounded-md border-border/60 bg-background/50 text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
            >
              <Plus className="h-3 w-3" />
            </Button>
            {/* Remove */}
            <Button
              size="icon"
              variant="ghost"
              disabled={isDisabled}
              onClick={handleRemove}
              className="ml-1 h-6 w-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-foreground">₹{item.totalPrice}</p>
          <p className="text-[10px] text-muted-foreground">₹{item.unitPrice} each</p>
        </div>
      </div>
    </motion.div>
  );
}
