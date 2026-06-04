import { AlertTriangle } from "lucide-react";

type CartValidationWarningsProps = {
  warnings: string[];
};

export function CartValidationWarnings({ warnings }: CartValidationWarningsProps) {
  return (
    <section className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Warnings</h3>
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {warnings.map((warning) => (
          <li className="leading-5" key={warning}>
            {warning}
          </li>
        ))}
      </ul>
    </section>
  );
}
