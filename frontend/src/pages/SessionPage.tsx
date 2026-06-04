import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { OrderingPage } from "./OrderingPage";

export function SessionPage() {
  const { sessionId } = useParams();

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute right-4 top-16 z-10">
        <Badge variant="secondary">Viewing {sessionId ?? "mock session"}</Badge>
      </div>
      <OrderingPage />
    </div>
  );
}
