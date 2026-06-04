import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SendButton() {
  return (
    <Button aria-label="Send message" size="icon">
      <Send className="h-4 w-4" />
    </Button>
  );
}
