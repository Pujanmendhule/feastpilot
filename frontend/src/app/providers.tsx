import type { PropsWithChildren } from "react";
import { SessionProvider } from "../features/session/SessionContext";

export function AppProviders({ children }: PropsWithChildren) {
  return <SessionProvider>{children}</SessionProvider>;
}
