import type { MockSession } from "@/features/session/sessionState";
import { ConversationHeader } from "./ConversationHeader";
import { ConversationInputArea } from "./ConversationInputArea";
import { MessageList } from "./MessageList";
import { ToolActivityIndicator } from "./ToolActivityIndicator";

type ConversationRegionProps = {
  session: MockSession;
};

export function ConversationRegion({ session }: ConversationRegionProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col border-r border-border bg-card">
      <ConversationHeader session={session} />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
        <MessageList messages={session.messages} />
      </div>
      <ToolActivityIndicator />
      <ConversationInputArea />
    </section>
  );
}
