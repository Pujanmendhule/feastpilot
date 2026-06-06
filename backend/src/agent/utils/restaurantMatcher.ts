export type RestaurantCandidate = {
  id: string;
  name: string;
};

/**
 * Matches a user message to a restaurant from the last search results.
 * Supports exact and partial name matches; returns null when ambiguous.
 */
export function matchRestaurantSelection(
  message: string,
  candidates: RestaurantCandidate[]
): RestaurantCandidate | null {
  const normalized = message.trim().toLowerCase();
  if (!normalized || candidates.length === 0) {
    return null;
  }

  const exact = candidates.find(
    (candidate) => candidate.name.toLowerCase() === normalized
  );
  if (exact) {
    return exact;
  }

  const nameContainsQuery = candidates.filter((candidate) =>
    candidate.name.toLowerCase().includes(normalized)
  );
  if (nameContainsQuery.length === 1) {
    return nameContainsQuery[0];
  }

  const queryContainsName = candidates.filter((candidate) =>
    normalized.includes(candidate.name.toLowerCase())
  );
  if (queryContainsName.length === 1) {
    return queryContainsName[0];
  }

  if (nameContainsQuery.length > 1) {
    const wordMatches = nameContainsQuery.filter((candidate) => {
      const words = candidate.name.toLowerCase().split(/\s+/);
      return words.some((word) => word.startsWith(normalized) || word === normalized);
    });
    if (wordMatches.length === 1) {
      return wordMatches[0];
    }
  }

  return null;
}
