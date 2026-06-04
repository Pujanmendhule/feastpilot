import { ChatComposer } from "./ChatComposer";
import { RetryButton } from "./RetryButton";
import { SendButton } from "./SendButton";
import { TranscriptPreview } from "./TranscriptPreview";
import { VoiceRecorder } from "./VoiceRecorder";

export function ConversationInputArea() {
  return (
    <footer className="border-t border-border bg-card px-5 py-4 md:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        <TranscriptPreview />
        <div className="flex items-end gap-2">
          <VoiceRecorder />
          <ChatComposer />
          <SendButton />
          <RetryButton />
        </div>
      </div>
    </footer>
  );
}
