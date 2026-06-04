/** Generates a unique session identifier (pure, unit-testable). */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
