export type MenuItemCandidate = {
  id: string;
  name: string;
};

/**
 * Matches a user query to a menu item from available candidates.
 */
export function matchMenuItem(
  query: string,
  candidates: MenuItemCandidate[]
): MenuItemCandidate | null {
  const normalized = query.trim().toLowerCase();
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
      return words.some(
        (word) => word.startsWith(normalized) || normalized.startsWith(word)
      );
    });
    if (wordMatches.length === 1) {
      return wordMatches[0];
    }

    return nameContainsQuery.sort(
      (a, b) => a.name.length - b.name.length
    )[0];
  }

  const queryWords = normalized.split(/\s+/).filter(Boolean);
  if (queryWords.length > 1) {
    const allWordsMatches = candidates.filter((candidate) => {
      const nameLower = candidate.name.toLowerCase();
      return queryWords.every((word) => nameLower.includes(word));
    });

    if (allWordsMatches.length === 1) {
      return allWordsMatches[0];
    }

    if (allWordsMatches.length > 1) {
      return allWordsMatches.sort(
        (a, b) => a.name.length - b.name.length
      )[0];
    }
  }

  return null;
}
