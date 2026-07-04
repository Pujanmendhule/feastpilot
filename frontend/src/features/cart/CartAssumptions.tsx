import { useSessionContext } from "@/features/session/SessionContext";
import { Info } from "lucide-react";

/**
 * CartAssumptions — shows planning assumptions from the live session.
 * Reads from session.assumptions (a Record<string, any> from the backend).
 * Renders nothing when there are no assumptions.
 */
export function CartAssumptions() {
  const { session } = useSessionContext();

  const assumptions = session?.assumptions;
  if (!assumptions || typeof assumptions !== "object") return null;

  const entries = Object.entries(assumptions).filter(([, v]) => v != null);
  if (entries.length === 0) return null;

  return (
    <section className="mt-4 rounded-xl border border-border/60 bg-card/40 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Info className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Assumptions</h3>
      </div>
      <ul className="space-y-1.5 text-xs text-muted-foreground font-medium">
        {entries.map(([key, value]) => (
          <li key={key} className="leading-5">
            <span className="font-semibold capitalize text-foreground/70">{key}:</span>{" "}
            {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </li>
        ))}
      </ul>
    </section>
  );
}
