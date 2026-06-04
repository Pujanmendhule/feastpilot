import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RetryButton() {
  return (
    <Button aria-label="Retry" size="icon" variant="ghost">
      <RotateCcw className="h-4 w-4" />
    </Button>
  );
}
