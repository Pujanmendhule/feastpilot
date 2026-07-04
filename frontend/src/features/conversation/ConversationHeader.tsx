import { useSessionContext } from "../session/SessionContext";
import { Badge } from "@/components/ui/badge";
import { Cpu, Clock } from "lucide-react";

export function ConversationHeader() {
  const { session, connectionStatus, mode, setMode } = useSessionContext();

  const getConnectionBadge = () => {
    if (connectionStatus === "connected")
      return <Badge variant="default" className="bg-emerald-600 border-0 text-white text-[10px] font-bold px-2 py-0.5">Live</Badge>;
    if (connectionStatus === "connecting")
      return <Badge variant="outline" className="border-amber-500 text-amber-500 text-[10px] font-bold px-2 py-0.5 animate-pulse">Connecting…</Badge>;
    return <Badge variant="outline" className="border-red-500 text-red-500 text-[10px] font-bold px-2 py-0.5">Offline</Badge>;
  };

  const messageCount = session?.messages.filter(m => m.role !== "system").length ?? 0;
  const selectedRestaurantId = session?.selectedRestaurantId;
  const selectedRestaurantName = session?.lastSearchResults?.find(
    (r) => r.id === selectedRestaurantId
  )?.name ?? selectedRestaurantId;

  return (
    <header className="flex items-center justify-between border-b border-border/60 bg-card/30 backdrop-blur-sm px-4 py-3 md:px-6 gap-3 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
          <Cpu className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-foreground">AI Chat</h2>
            {getConnectionBadge()}
            {selectedRestaurantId && (
              <Badge variant="secondary" className="text-[10px] max-w-[120px] truncate">
                📍 {selectedRestaurantName}
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {messageCount} message{messageCount !== 1 ? "s" : ""} this session
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/40 p-1 shrink-0">
        <button
          onClick={() => setMode("chat")}
          className={`rounded-md px-3 py-1 text-[11px] font-bold transition ${
            mode === "chat"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Chat
        </button>
        <button
          title="Voice (Coming Soon)"
          className="rounded-md px-3 py-1 text-[11px] font-bold text-muted-foreground cursor-not-allowed opacity-50"
        >
          Voice
        </button>
      </div>
    </header>
  );
}
