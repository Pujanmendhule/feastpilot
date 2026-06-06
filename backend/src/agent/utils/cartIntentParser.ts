export type CartIntent =
  | { type: "view" }
  | { type: "add"; itemQuery: string; quantity: number }
  | { type: "addAnother"; itemQuery: string; quantity: number }
  | { type: "setQuantity"; itemQuery: string; quantity: number }
  | { type: "remove"; itemQuery: string };

const ITEM_QUERY_STOP_WORDS = new Set([
  "add",
  "order",
  "another",
  "one",
  "more",
  "please",
  "the",
  "a",
  "an",
  "to",
  "some",
]);

function extractItemQuery(message: string): string {
  return message
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0 && !ITEM_QUERY_STOP_WORDS.has(word))
    .join(" ")
    .trim();
}

function isViewCartMessage(normalized: string): boolean {
  return (
    /^(show|view)\s+cart$/.test(normalized) ||
    normalized === "my cart" ||
    normalized === "cart" ||
    /\b(show|view)\s+cart\b/.test(normalized) ||
    /\bmy\s+cart\b/.test(normalized)
  );
}

/**
 * Parses cart-related intents from natural-language messages.
 */
export function parseCartIntent(message: string): CartIntent | null {
  const normalized = message.trim().toLowerCase();

  if (isViewCartMessage(normalized)) {
    return { type: "view" };
  }

  const setQuantityMatch = normalized.match(
    /^change\s+(.+?)\s+quantity\s+to\s+(\d+)$/
  );
  if (setQuantityMatch) {
    return {
      type: "setQuantity",
      itemQuery: setQuantityMatch[1].trim(),
      quantity: Number(setQuantityMatch[2]),
    };
  }

  if (normalized.startsWith("remove ")) {
    const itemQuery = normalized.slice("remove ".length).trim();
    if (itemQuery) {
      return { type: "remove", itemQuery };
    }
  }

  if (/\badd\b/.test(normalized) && /\b(another|one more)\b/.test(normalized)) {
    const itemQuery = extractItemQuery(normalized);
    if (itemQuery) {
      return { type: "addAnother", itemQuery, quantity: 1 };
    }
  }

  if (/\b(add|order)\b/.test(normalized)) {
    const itemQuery = extractItemQuery(normalized);
    if (itemQuery) {
      return { type: "add", itemQuery, quantity: 1 };
    }
  }

  return null;
}
