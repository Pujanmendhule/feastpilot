import type { MockMessage } from "@/features/session/sessionState";

type UserMessageBubbleProps = {
  message: MockMessage;
};

export function UserMessageBubble({ message }: UserMessageBubbleProps) {
  return (
    <article className="ml-auto max-w-[78%] rounded-md bg-primary px-4 py-3 text-primary-foreground shadow-sm">
      <p className="text-sm leading-6">{message.content}</p>
      <div className="mt-2 flex justify-end text-xs text-primary-foreground/75">
        {message.time}
      </div>
    </article>
  );
}
