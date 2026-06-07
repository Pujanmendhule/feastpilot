import type { Session } from "../../types/session";

/**
 * Resolved reference to a previously-discussed menu item.
 */
export interface ResolvedReference {
  itemId: string;
  itemName: string;
}

/**
 * Reference keywords that indicate the user is referring to the
 * most recently discussed menu item. Ordered longest-first so
 * multi-word phrases are matched before single words.
 */
const REFERENCE_KEYWORDS = [
  "same item",
  "one more",
  "the same",
  "same",
  "another",
  "that",
  "it",
];

/**
 * Checks whether the user message contains a reference keyword
 * as a whole word (word-boundary match).
 */
function containsReferenceKeyword(message: string): boolean {
  const lower = message.toLowerCase();
  return REFERENCE_KEYWORDS.some((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    return regex.test(lower);
  });
}

/**
 * Resolve a conversational reference in the user's message.
 *
 * If the message contains a reference keyword (it, that, same, another,
 * one more, same item) AND the session has a remembered menu item,
 * returns { itemId, itemName }. Otherwise returns null.
 */
export function resolveReference(
  userMessage: string,
  session: Session
): ResolvedReference | null {
  if (!containsReferenceKeyword(userMessage)) {
    return null;
  }

  if (!session.lastReferencedMenuItemId || !session.lastReferencedMenuItemName) {
    return null;
  }

  return {
    itemId: session.lastReferencedMenuItemId,
    itemName: session.lastReferencedMenuItemName,
  };
}

/**
 * Detect whether the user message is an incremental add
 * ("add one more", "add another", "one more").
 *
 * These mean quantity += 1, not quantity = <number>.
 */
export function isIncrementalAdd(userMessage: string): boolean {
  const lower = userMessage.toLowerCase();
  return (
    /\b(add\s+)?one\s+more\b/.test(lower) ||
    /\badd\s+another\b/.test(lower) ||
    /\banother\s+one\b/.test(lower) ||
    lower.trim() === "one more" ||
    lower.trim() === "another"
  );
}

/**
 * Extract an absolute quantity from messages like:
 *   "make it 3"
 *   "change it to 3"
 *   "set it to 3"
 *   "make it to 5"
 *
 * Returns the numeric quantity or null if no pattern matches.
 */
export function extractAbsoluteQuantity(userMessage: string): number | null {
  const lower = userMessage.toLowerCase();

  const match = lower.match(
    /\b(?:make|change|set|update)\s+it\s+(?:to\s+)?(\d+)\b/
  );
  if (match) {
    return Number(match[1]);
  }

  return null;
}
