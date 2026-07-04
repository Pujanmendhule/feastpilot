import { useEffect } from "react";
import { useSessionContext } from "@/features/session/SessionContext";
import { CartRegion } from "@/features/cart";
import { ConversationRegion } from "@/features/conversation";
import { Header } from "@/components/Header";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function OrderingPage() {
  const { initSession, isLoading, error, session, connectionStatus } = useSessionContext();

  // Initialize session on mount
  useEffect(() => {
    initSession().catch(() => {
      // Error already set in context
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Global top nav */}
      <Header />

      {/* Connection error banner */}
      {error && connectionStatus === "disconnected" && (
        <div className="flex items-center gap-2 bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-xs font-medium text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => initSession()}
            className="ml-auto flex items-center gap-1 rounded bg-destructive/10 px-2 py-0.5 hover:bg-destructive/20 transition font-bold"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {/* Initial loading — first session create */}
      {!session && isLoading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 min-h-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <RefreshCw className="h-7 w-7 text-primary animate-spin" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">Starting FeastPilot…</p>
        </div>
      )}

      {/* Main two-panel layout */}
      {session && (
        <main className="flex min-h-0 flex-1 flex-col lg:flex-row overflow-hidden">
          <ConversationRegion />
          <CartRegion />
        </main>
      )}
    </div>
  );
}
