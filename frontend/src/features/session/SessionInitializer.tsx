import type { PropsWithChildren } from "react";
import { Badge } from "@/components/ui/badge";
import type { MockSession } from "./sessionState";

type SessionInitializerProps = PropsWithChildren<{
  session: MockSession;
}>;

export function SessionInitializer({ children, session }: SessionInitializerProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span className="text-sm font-semibold">FeastPilot ordering session</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="muted">{session.mode}</Badge>
          <Badge variant="outline">{session.status}</Badge>
        </div>
      </div>
      {children}
    </div>
  );
}
