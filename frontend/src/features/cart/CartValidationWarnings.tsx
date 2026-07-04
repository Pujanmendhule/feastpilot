import { AlertTriangle } from "lucide-react";

type CartValidationWarningsProps = {
  warnings: string[];
};

/**
 * CartValidationWarnings — displays a list of warning messages.
 * Uses theme-aware colors compatible with both dark and light mode.
 */
export function CartValidationWarnings({ warnings }: CartValidationWarningsProps) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <section className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
        <h3 className="text-sm font-bold text-yellow-400">Warnings</h3>
      </div>
      <ul className="space-y-1.5 text-xs text-yellow-300/80 font-medium">
        {warnings.map((warning) => (
          <li key={warning} className="leading-5">
            {warning}
          </li>
        ))}
      </ul>
    </section>
  );
}
