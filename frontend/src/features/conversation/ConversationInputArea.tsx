import React, { useState, useRef, useEffect } from "react";
import { useSessionContext } from "../session/SessionContext";
import { Button } from "../../components/ui/button";
import { Send, Mic, RotateCcw, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export function ConversationInputArea() {
  const { sendMessage, isLoading, session, clearSession } = useSessionContext();
  const [inputText, setInputText] = useState("");
  const [showVoiceTooltip, setShowVoiceTooltip] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the text area based on content height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    try {
      await sendMessage(trimmed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInputText(prompt);
    // Focus textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const showPrompts = !session || session.messages.filter(m => m.role !== "system").length === 0;

  const suggestionPrompts = [
    { text: "🔍 Search restaurants", query: "Search for restaurant options" },
    { text: "🔥 Recommend something spicy", query: "Recommend something spicy" },
    { text: "🌱 Suggest vegetarian items", query: "Suggest some good vegetarian dishes" },
    { text: "🍰 Show desserts", query: "What are some good desserts?" },
    { text: "💰 Plan under ₹400", query: "Suggest a meal plan within ₹400 budget" },
  ];

  return (
    <footer className="border-t border-border/80 bg-card/40 backdrop-blur-md px-4 py-4 md:px-6 z-10 sticky bottom-0">
      <div className="mx-auto flex max-w-3xl flex-col gap-3.5">
        
        {/* Suggestion Prompts */}
        {showPrompts && (
          <div className="flex flex-col gap-2.5">
            <div className="rounded-xl border border-primary/15 bg-gradient-to-r from-primary/5 to-transparent p-4 text-xs md:text-sm text-foreground/90 leading-relaxed shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                <span className="text-primary text-base">✈️</span>
                Welcome to FeastPilot V1
              </h3>
              <p className="text-muted-foreground font-medium mb-1">
                Hi, I'm FeastPilot, your personal AI Food Assistant. I can help you:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 pl-4 list-disc text-muted-foreground font-medium text-xs">
                <li>Find restaurants matching your preference</li>
                <li>Recommend specific meals & side pairings</li>
                <li>Plan delicious meals within budget limits</li>
                <li>Build your multi-restaurant orders</li>
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestionPrompts.map((p, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => handlePromptClick(p.query)}
                  className="rounded-full bg-background border border-border/70 hover:border-primary px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold shadow-sm transition"
                >
                  {p.text}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area Toolbar */}
        <div className="flex items-end gap-2.5 relative">
          
          {/* Voice Button (Coming Soon) */}
          <div className="relative">
            <Button
              aria-label="Voice input"
              size="icon"
              variant="outline"
              className="shrink-0 h-10 w-10 rounded-xl bg-background border-border/80 text-muted-foreground hover:text-foreground shadow-sm transition hover:border-primary/40 relative"
              onMouseEnter={() => setShowVoiceTooltip(true)}
              onMouseLeave={() => setShowVoiceTooltip(false)}
              onClick={() => {
                setShowVoiceTooltip(true);
                setTimeout(() => setShowVoiceTooltip(false), 2000);
              }}
            >
              <Mic className="h-4.5 w-4.5" />
            </Button>
            {showVoiceTooltip && (
              <div className="absolute bottom-12 left-0 z-30 shrink-0 w-32 rounded bg-zinc-950 px-2 py-1.5 text-[10px] font-bold text-white text-center shadow-lg border border-border/40">
                Voice (Coming Soon)
              </div>
            )}
          </div>

          {/* Composer Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask FeastPilot (e.g., recommend a spicy veg pizza)..."
              className="w-full min-h-[40px] max-h-[120px] resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 pr-10 text-xs md:text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:ring-1 focus:ring-primary focus:border-primary shadow-inner leading-5 disabled:opacity-75"
            />
          </div>

          {/* Send Button */}
          <Button
            aria-label="Send message"
            size="icon"
            onClick={handleSend}
            disabled={isLoading || !inputText.trim()}
            className="shrink-0 h-10 w-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10 transition"
          >
            {isLoading ? (
              <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Send className="h-4.5 w-4.5" />
            )}
          </Button>

          {/* Reset Session Button */}
          {session && session.messages.length > 1 && (
            <Button
              aria-label="Restart session"
              size="icon"
              variant="outline"
              onClick={clearSession}
              disabled={isLoading}
              className="shrink-0 h-10 w-10 rounded-xl bg-background border-border/80 text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 shadow-sm transition"
              title="Restart Session"
            >
              <RotateCcw className="h-4.5 w-4.5" />
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
}
