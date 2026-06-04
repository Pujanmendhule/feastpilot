import type { MockMessage } from "@/features/session/sessionState";

type SystemNoticeProps = {
  message: MockMessage;
};

export function SystemNotice({ message }: SystemNoticeProps) {
  return (
    <div className="rounded-md border border-border bg-accent px-4 py-3 text-sm text-accent-foreground">
      {message.content}
    </div>
  );
}
