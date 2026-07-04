import { useState, useEffect } from "react";
import { useSessionContext } from "../session/SessionContext";
import { RestaurantService, type ApiRestaurant, type ApiMenuItem } from "../../services/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Star, Clock, ShoppingCart, Check, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export function RestaurantCardsList({ candidates }: { candidates: { id: string; name: string }[] }) {
  const { sendMessage } = useSessionContext();
  const [detailsMap, setDetailsMap] = useState<Record<string, ApiRestaurant>>({});

  useEffect(() => {
    if (candidates.length === 0) return;
    RestaurantService.getRestaurants()
      .then((all) => {
        const map: Record<string, ApiRestaurant> = {};
        all.forEach((r) => { map[r.id] = r; });
        setDetailsMap(map);
      })
      .catch(console.error);
  }, [candidates]);

  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {candidates.map((candidate, idx) => {
        const details = detailsMap[candidate.id];
        const rating = details?.rating ?? 4.0;
        const cuisines = details?.cuisines?.join(", ") ?? "Cuisine details";
        const delivery = details?.deliveryEstimateMinutes ?? 30;

        return (
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="overflow-hidden border border-border bg-card/50 transition hover:border-primary/50 hover:bg-card">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold">{candidate.name}</CardTitle>
                  <div className="flex items-center gap-1 shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs font-semibold text-emerald-500">
                    <Star className="h-3 w-3 fill-current" />
                    {rating.toFixed(1)}
                  </div>
                </div>
                <CardDescription className="line-clamp-1 text-xs">{cuisines}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 pb-3 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {delivery} mins
                </div>
                <div className="h-3 w-px bg-border" />
                <Badge variant="outline" className="capitalize text-[10px] py-0 px-1.5">
                  {details?.priceRange ?? "mid"}
                </Badge>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button
                  size="sm"
                  className="w-full text-xs font-semibold"
                  onClick={() => sendMessage(candidate.name)}
                >
                  Select Restaurant
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

export function MenuItemCardsList({ items, restaurantId }: { items: { id: string; name: string; restaurantId: string }[]; restaurantId: string }) {
  const { addRecommendedItemToCart, isCartLoading } = useSessionContext();
  const [fullItems, setFullItems] = useState<ApiMenuItem[]>([]);
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (restaurantId) {
      RestaurantService.getMenu(restaurantId)
        .then((res) => setFullItems(res.items))
        .catch(console.error);
    }
  }, [restaurantId]);

  const handleAddToCart = async (itemId: string) => {
    try {
      await addRecommendedItemToCart(restaurantId, itemId, 1);
      setAddedItems((prev) => ({ ...prev, [itemId]: true }));
      setTimeout(() => {
        setAddedItems((prev) => ({ ...prev, [itemId]: false }));
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-2.5">
      {items.map((item, idx) => {
        const details = fullItems.find((fi) => fi.id === item.id);
        const price = details?.price ?? 0;
        const description = details?.description ?? "Freshly prepared ingredients";
        const isVeg = details?.isVegetarian ?? false;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card/30 p-3.5 hover:bg-card/60 transition"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${isVeg ? "bg-emerald-500" : "bg-red-500"}`} title={isVeg ? "Veg" : "Non-Veg"} />
                <h4 className="text-xs font-semibold text-foreground">{item.name}</h4>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{description}</p>
              <div className="mt-2 text-xs font-bold text-foreground">{"\u20B9"}{price}</div>
            </div>
            <Button
              size="sm"
              variant={addedItems[item.id] ? "outline" : "default"}
              disabled={isCartLoading}
              onClick={() => handleAddToCart(item.id)}
              className="shrink-0 h-8 text-xs px-3 font-semibold"
            >
              {addedItems[item.id] ? (
                <>
                  <Check className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                  Added
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-1 h-3.5 w-3.5" />
                  Add
                </>
              )}
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}

export function RecommendationCard({ recommendation }: { recommendation: { type: string; item?: any; restaurantId?: string; rationale?: string; pairedWith?: string } }) {
  const { addRecommendedItemToCart, isCartLoading } = useSessionContext();
  const [isAdded, setIsAdded] = useState(false);

  const item = recommendation.item;
  const name = typeof item?.name === "string" ? item.name : null;
  const price = typeof item?.price === "number" ? item.price : null;
  const description = typeof item?.description === "string" ? item.description : null;
  const isVeg = typeof item?.isVegetarian === "boolean" ? item.isVegetarian : null;
  const rationale = typeof recommendation.rationale === "string" ? recommendation.rationale : null;
  const canAddToCart =
    typeof recommendation.restaurantId === "string" &&
    typeof item?.id === "string";

  const handleAddToCart = async () => {
    if (!canAddToCart) return;

    try {
      await addRecommendedItemToCart(recommendation.restaurantId!, item.id, 1);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  if (!item || !name || !rationale) {
    return (
      <div className="mt-3 rounded-lg border border-border bg-card/40 p-4 text-xs text-muted-foreground">
        Recommendation data is unavailable for this response.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-3 overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-card/50 p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {isVeg !== null ? (
              <span className={`h-2.5 w-2.5 rounded-full ${isVeg ? "bg-emerald-500" : "bg-red-500"}`} />
            ) : null}
            <h3 className="text-sm font-bold text-foreground">{name}</h3>
          </div>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
          ) : null}
          {price !== null ? (
            <div className="mt-2 text-sm font-extrabold text-primary">{"\u20B9"}{price}</div>
          ) : null}
        </div>
        <Button
          size="sm"
          onClick={handleAddToCart}
          disabled={isCartLoading || !canAddToCart}
          className="shrink-0 font-bold bg-primary text-primary-foreground hover:bg-primary/95"
        >
          {isAdded ? (
            <>
              <Check className="mr-1 h-3.5 w-3.5" /> Added
            </>
          ) : (
            <>
              <ShoppingCart className="mr-1 h-3.5 w-3.5" /> Add to Cart
            </>
          )}
        </Button>
      </div>

      <div className="mt-3.5 rounded bg-muted/40 p-2.5 text-xs italic text-muted-foreground leading-relaxed">
        {rationale}
      </div>
    </motion.div>
  );
}

export function ClarificationCard() {
  const { sendMessage, isLoading } = useSessionContext();

  return (
    <div className="mt-3">
      <div className="text-xs text-muted-foreground font-semibold mb-2">Select an option to clarify:</div>
      <div className="flex flex-wrap gap-2">
        {["Vegetarian", "Non-vegetarian", "Any"].map((opt) => (
          <Button
            key={opt}
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => sendMessage(opt)}
            className="rounded-full text-xs font-semibold px-4 border-primary/20 hover:border-primary hover:bg-primary/5 transition"
          >
            {opt}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function ErrorCard({ errorText }: { errorText: string }) {
  const { initSession } = useSessionContext();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await initSession();
    } catch (err) {
      console.error(err);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-destructive">
      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-sm font-semibold">Service Connection Error</h4>
        <p className="mt-1 text-xs leading-5 text-destructive/80">{errorText}</p>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRetry}
          disabled={retrying}
          className="mt-3 h-8 text-xs border-destructive/30 text-destructive bg-transparent hover:bg-destructive/10"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} />
          {retrying ? "Connecting..." : "Retry Connection"}
        </Button>
      </div>
    </div>
  );
}
