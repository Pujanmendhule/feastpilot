import { useEffect, useRef } from "react";
import { useSessionContext } from "../session/SessionContext";
import { ConversationHeader } from "./ConversationHeader";
import { ConversationInputArea } from "./ConversationInputArea";
import { MessageList } from "./MessageList";
import { ErrorCard } from "./SpecialCards";
import { Sparkles } from "lucide-react";

export function ConversationRegion() {
  const { session, isLoading, error } = useSessionContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or loading state change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages, isLoading]);

  return (
    <section className="flex min-h-0 flex-1 flex-col border-r border-border/60 bg-card/10">
      
      {/* Real-time sync sub-header */}
      <ConversationHeader />
      
      {/* Scrollable Conversation Stream */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 select-none">
        {error && <ErrorCard errorText={error} />}
        
        {session && session.messages.length > 0 && (
          <MessageList messages={session.messages} />
        )}

        {/* Dynamic Typing/Processing State */}
        {isLoading && (
          <div className="mx-auto flex w-full max-w-3xl justify-start items-center gap-3 px-4 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Sparkles className="h-4.5 w-4.5 animate-pulse text-primary" />
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-card/60 border border-border px-4 py-2.5 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>
      
      {/* Input composer area */}
      <ConversationInputArea />
    </section>
  );
}
