import { type ApiMessage } from "../../services/api";
import { AssistantMessageBubble } from "./AssistantMessageBubble";
import { SystemNotice } from "./SystemNotice";
import { UserMessageBubble } from "./UserMessageBubble";

type MessageListProps = {
  messages: ApiMessage[];
};

export function MessageList({ messages }: MessageListProps) {
  // Find index of the latest assistant message
  const lastAssistantIndex = messages.reduce((latestIdx, msg, idx) => {
    return msg.role === "assistant" ? idx : latestIdx;
  }, -1);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 py-4">
      {messages.map((message, idx) => {
        if (message.role === "system") {
          return <SystemNotice key={message.id} message={message} />;
        }

        if (message.role === "user") {
          return <UserMessageBubble key={message.id} message={message} />;
        }

        return (
          <AssistantMessageBubble
            key={message.id}
            message={message}
            isLatest={idx === lastAssistantIndex}
          />
        );
      })}
    </div>
  );
}
