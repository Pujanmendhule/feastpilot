import type { PropsWithChildren } from "react";
import { useSessionContext } from "./SessionContext";
import { Badge } from "@/components/ui/badge";

/**
 * SessionInitializer — wraps app content with a slim session status bar.
 * Reads live data from SessionContext (no mock data dependency).
 */
export function SessionInitializer({ children }: PropsWithChildren) {
  const { session, connectionStatus, mode } = useSessionContext();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${
              connectionStatus === "connected"
                ? "bg-emerald-500"
                : connectionStatus === "connecting"
                ? "bg-amber-500 animate-pulse"
                : "bg-red-500 animate-pulse"
            }`}
          />
          <span className="text-sm font-semibold">FeastPilot ordering session</span>
          {session?.id && (
            <span className="hidden sm:inline text-xs text-muted-foreground font-mono">
              {session.id.slice(0, 8)}…
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize text-[10px]">
            {mode}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {connectionStatus}
          </Badge>
        </div>
      </div>
      {children}
    </div>
  );
}
