import { MessageSquare, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

type ModeToggleProps = {
  mode: "voice" | "chat";
};

export function ModeToggle({ mode }: ModeToggleProps) {
  return (
    <div className="grid h-10 grid-cols-2 rounded-md border border-border bg-muted p-1">
      <Button
        aria-pressed={mode === "chat"}
        className="h-8 px-3"
        size="sm"
        variant={mode === "chat" ? "secondary" : "ghost"}
      >
        <MessageSquare className="h-4 w-4" />
        Chat
      </Button>
      <Button
        aria-pressed={mode === "voice"}
        className="h-8 px-3"
        size="sm"
        variant={mode === "voice" ? "secondary" : "ghost"}
      >
        <Mic className="h-4 w-4" />
        Voice
      </Button>
    </div>
  );
}
