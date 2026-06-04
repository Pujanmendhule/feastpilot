import type { MockMessage } from "@/features/session/sessionState";
import { AssistantMessageBubble } from "./AssistantMessageBubble";
import { SystemNotice } from "./SystemNotice";
import { UserMessageBubble } from "./UserMessageBubble";

type MessageListProps = {
  messages: MockMessage[];
};

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      {messages.map((message) => {
        if (message.role === "system") {
          return <SystemNotice key={message.id} message={message} />;
        }

        if (message.role === "user") {
          return <UserMessageBubble key={message.id} message={message} />;
        }

        return <AssistantMessageBubble key={message.id} message={message} />;
      })}
    </div>
  );
}
