import { useState, useEffect } from "react";
import { useSessionContext } from "@/features/session/SessionContext";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, Cpu, Wifi, WifiOff, Copy, Check, User } from "lucide-react";

export function Header() {
  const { session, connectionStatus } = useSessionContext();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Add dark class by default if not set
    const isLight = document.documentElement.classList.contains("light");
    setTheme(isLight ? "light" : "dark");
    if (!isLight) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "dark") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      setTheme("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      setTheme("dark");
    }
  };

  const copySessionId = () => {
    if (session?.id) {
      navigator.clipboard.writeText(session.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-emerald-500 shadow-emerald-500/50";
      case "connecting":
        return "bg-amber-500 shadow-amber-500/50 animate-pulse";
      default:
        return "bg-red-500 shadow-red-500/50 animate-pulse";
    }
  };

  const formatSessionId = (id: string) => {
    if (id.length <= 10) return id;
    return `${id.slice(0, 5)}...${id.slice(-5)}`;
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/60 backdrop-blur-md px-4 md:px-6 z-20 sticky top-0">
      {/* Logo and Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-600 shadow-lg shadow-primary/20">
            {/* Elegant pilot wings icon or rocket SVG */}
            <svg
              className="h-5 w-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.9-.2-1.9.1-2.4.9l-.5.5c-.4.4-.3 1.1.2 1.3l8.6 3.6-3.6 3.6-2.6-.7c-.4-.1-.9 0-1.2.3L3 17l2.2 2.2L7.4 21l.8-1.2c.3-.3.4-.8.3-1.2l-.7-2.6 3.6-3.6 3.6 8.6c.2.5.9.6 1.3.2l.5-.5c.8-.5 1-1.5.8-2.4Z" />
            </svg>
          </div>
          <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Feast<span className="text-primary">Pilot</span>
          </span>
        </div>

        <Badge variant="outline" className="flex items-center gap-1 border-primary/20 bg-primary/5 text-primary text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full shrink-0">
          <Cpu className="h-3 w-3" />
          AI Assistant
        </Badge>
      </div>

      {/* Session, Connection and Controls */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Connection Status */}
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-background/50 px-2.5 py-1 border border-border/40 text-xs">
          <span className={`h-2 w-2 rounded-full shadow-sm ${getStatusColor()}`} />
          <span className="text-muted-foreground font-medium capitalize">
            {connectionStatus === "connected" ? "Live" : connectionStatus}
          </span>
          {connectionStatus === "connected" ? (
            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-red-500" />
          )}
        </div>

        {/* Session ID Copy tool */}
        {session?.id && (
          <button
            onClick={copySessionId}
            className="flex items-center gap-1.5 rounded-lg bg-background/50 hover:bg-background border border-border/40 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground font-mono transition"
            title="Copy Session ID"
          >
            <span>{formatSessionId(session.id)}</span>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 opacity-60" />
            )}
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition"
          title="Toggle Theme"
        >
          {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Profile Avatar Placeholder */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-orange-500/10 border border-primary/20 text-primary font-bold shadow-inner">
          <User className="h-4.5 w-4.5" />
        </div>
      </div>
    </header>
  );
}
