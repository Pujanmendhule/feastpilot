import type { MockMessage } from "@/features/session/sessionState";

type AssistantMessageBubbleProps = {
  message: MockMessage;
};

export function AssistantMessageBubble({ message }: AssistantMessageBubbleProps) {
  return (
    <article className="mr-auto max-w-[82%] rounded-md border border-border bg-background px-4 py-3 shadow-sm">
      <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
        Assistant
      </div>
      <p className="text-sm leading-6">{message.content}</p>
      <div className="mt-2 text-xs text-muted-foreground">{message.time}</div>
    </article>
  );
}
