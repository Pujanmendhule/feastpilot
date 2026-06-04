import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VoiceRecorder() {
  return (
    <Button aria-label="Voice input" size="icon" variant="outline">
      <Mic className="h-4 w-4" />
    </Button>
  );
}
