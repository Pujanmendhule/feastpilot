import { Badge } from "@/components/ui/badge";
import type { MockCartItem } from "@/features/session/sessionState";
import { formatInr } from "@/features/session/sessionState";

type CartItemRowProps = {
  item: MockCartItem;
};

export function CartItemRow({ item }: CartItemRowProps) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-muted px-2 text-xs font-semibold">
              {item.quantity}
            </span>
            <p className="text-sm font-medium">{item.name}</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="muted">
                {tag}
              </Badge>
            ))}
          </div>
          {item.notes ? (
            <p className="mt-2 text-xs text-muted-foreground">{item.notes}</p>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold">{formatInr(item.subtotal)}</p>
          <p className="text-xs text-muted-foreground">{formatInr(item.unitPrice)} each</p>
        </div>
      </div>
    </div>
  );
}
