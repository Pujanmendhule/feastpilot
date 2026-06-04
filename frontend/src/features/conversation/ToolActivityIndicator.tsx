import { CheckCircle2 } from "lucide-react";

export function ToolActivityIndicator() {
  return (
    <div className="border-t border-border bg-background px-5 py-3 md:px-6">
      <div className="mx-auto flex max-w-3xl items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        Mock restaurant and cart state loaded locally
      </div>
    </div>
  );
}
