import { type ApiMessage } from "../../services/api";

type SystemNoticeProps = {
  message: ApiMessage;
};

export function SystemNotice({ message }: SystemNoticeProps) {
  return (
    <div className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-xs md:text-sm text-primary font-medium text-center">
      {message.content}
    </div>
  );
}
