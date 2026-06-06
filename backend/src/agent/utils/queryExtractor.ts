const STOP_WORDS = new Set([
  "i",
  "want",
  "need",
  "show",
  "me",
  "can",
  "you",
  "please",
  "looking",
  "for",
  "suggest",
  "some",
  "a",
  "an",
  "the",
  "places",
  "restaurant",
  "restaurants",
]);

function singularize(word: string): string {
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) {
    return word.slice(0, -1);
  }
  return word;
}

/**
 * Extracts a concise food search query from a natural-language message.
 */
export function extractSearchQuery(message: string): string {
  const words = message
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !STOP_WORDS.has(word))
    .map(singularize);

  const query = words.join(" ").trim();
  return query || message.toLowerCase().trim();
}
