import { Navigate, Route, Routes } from "react-router-dom";
import { DevMockDataPage } from "@/pages/DevMockDataPage";
import { OrderingPage } from "@/pages/OrderingPage";
import { SessionPage } from "@/pages/SessionPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<OrderingPage />} />
      <Route path="/sessions/:sessionId" element={<SessionPage />} />
      <Route path="/dev/mock-data" element={<DevMockDataPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
