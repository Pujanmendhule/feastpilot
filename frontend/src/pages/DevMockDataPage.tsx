import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { mockSession } from "@/features/session";
import { formatInr } from "@/features/session/sessionState";

export function DevMockDataPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Mock data snapshot</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Static frontend state for the application shell
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Back to session</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {mockSession.cart.restaurantGroups.map((group) => (
            <section
              className="rounded-md border border-border bg-card p-4 shadow-sm"
              key={group.id}
            >
              <h2 className="text-base font-semibold">{group.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {group.cuisines.join(" / ")} / {group.deliveryWindow}
              </p>
              <div className="mt-4 space-y-2">
                {group.items.map((item) => (
                  <div className="flex justify-between gap-4 text-sm" key={item.id}>
                    <span>{item.name}</span>
                    <span className="font-medium">{formatInr(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
