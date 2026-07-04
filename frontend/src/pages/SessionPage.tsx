import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useSessionContext } from "@/features/session/SessionContext";
import { CartRegion } from "@/features/cart";
import { ConversationRegion } from "@/features/conversation";
import { Header } from "@/components/Header";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { initSession, isLoading, error, session, connectionStatus } = useSessionContext();

  // Restore the specific session from the URL
  useEffect(() => {
    if (sessionId) {
      initSession(sessionId).catch(() => {});
    }
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      {/* Session info bar */}
      <div className="flex items-center gap-3 border-b border-border/60 bg-card/30 px-4 py-2 text-xs text-muted-foreground">
        <Link
          to="/"
          className="flex items-center gap-1 font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <span className="text-border/80">|</span>
        <span className="font-mono">
          Session: <span className="text-primary font-bold">{sessionId ?? "—"}</span>
        </span>
      </div>

      {/* Error banner */}
      {error && connectionStatus === "disconnected" && (
        <div className="flex items-center gap-2 bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-xs font-medium text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => sessionId && initSession(sessionId)}
            className="ml-auto flex items-center gap-1 rounded bg-destructive/10 px-2 py-0.5 hover:bg-destructive/20 transition font-bold"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {!session && isLoading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 min-h-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <RefreshCw className="h-7 w-7 text-primary animate-spin" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">Restoring session…</p>
        </div>
      )}

      {/* Main layout */}
      {session && (
        <main className="flex min-h-0 flex-1 flex-col lg:flex-row overflow-hidden">
          <ConversationRegion />
          <CartRegion />
        </main>
      )}
    </div>
  );
}
