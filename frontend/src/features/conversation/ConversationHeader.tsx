import { Badge } from "@/components/ui/badge";
import type { MockSession } from "@/features/session/sessionState";
import { ModeToggle } from "./ModeToggle";
import { SessionStatusBadge } from "./SessionStatusBadge";

type ConversationHeaderProps = {
  session: MockSession;
};

export function ConversationHeader({ session }: ConversationHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border bg-card px-5 py-4 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-normal">FeastPilot</h1>
            <Badge variant="secondary">Mock draft</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Session {session.id} updated {session.updatedAt}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SessionStatusBadge status={session.status} />
          <ModeToggle mode={session.mode} />
        </div>
      </div>
    </header>
  );
}
