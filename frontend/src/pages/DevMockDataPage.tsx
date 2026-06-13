import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Dev-only page — mock data has been replaced by real backend integration.
// This page now shows a redirect notice.
export function DevMockDataPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8 flex flex-col items-center justify-center">
      <div className="max-w-md text-center space-y-4">
        <div className="text-5xl">🛠️</div>
        <h1 className="text-2xl font-extrabold text-foreground">Dev Page</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Mock data has been replaced with real backend integration.
          Use the main app to explore live session data.
        </p>
        <Button asChild variant="default">
          <Link to="/">Go to FeastPilot</Link>
        </Button>
      </div>
    </main>
  );
}
