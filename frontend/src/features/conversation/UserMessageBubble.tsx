import { type ApiMessage } from "../../services/api";
import { User } from "lucide-react";

type UserMessageBubbleProps = {
  message: ApiMessage;
};

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function UserMessageBubble({ message }: UserMessageBubbleProps) {
  return (
    <article className="ml-auto max-w-[85%] sm:max-w-[78%] rounded-2xl bg-primary px-4 py-3.5 text-primary-foreground shadow-md shadow-primary/10 flex gap-3 items-start flex-row-reverse">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 border border-white/20 text-white">
        <User className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0 text-right">
        <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-white/70">
          You
        </div>
        <p className="text-xs md:text-sm leading-relaxed font-semibold text-white select-text">
          {message.content}
        </p>
        <div className="mt-1.5 flex justify-end text-[9px] font-semibold text-white/60">
          {formatTime(message.createdAt)}
        </div>
      </div>
    </article>
  );
}
