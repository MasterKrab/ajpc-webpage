/**
 * Normalizes a string by removing accents and converting to lowercase.
 */
export function normalizeString(inputString: string): string {
  return inputString
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * A fuzzy search that checks for character sequences with gaps.
 * It also provides a basic score.
 */
function getFuzzyScore(query: string, target: string): number | null {
  const normalizedQuery = normalizeString(query)
  const normalizedTarget = normalizeString(target)

  if (normalizedTarget.includes(normalizedQuery)) return 100 // Exact substring match is highest priority

  let score = 0
  let targetIndex = 0
  let queryIndex = 0

  while (
    queryIndex < normalizedQuery.length &&
    targetIndex < normalizedTarget.length
  ) {
    if (normalizedQuery[queryIndex] === normalizedTarget[targetIndex]) {
      // Bonus for consecutive matches
      if (
        queryIndex > 0 &&
        normalizedQuery[queryIndex - 1] === normalizedTarget[targetIndex - 1]
      ) {
        score += 10
      }

      score += 1
      queryIndex++
    } else {
      score -= 1
    }

    targetIndex++
  }

  return queryIndex === normalizedQuery.length ? score : null
}

/**
 * Performs a search in an array of objects based on a query.
 */
export function fuzzySearch<T>(
  query: string,
  items: T[],
  getKeys: (item: T) => string[],
): T[] {
  if (!query) return items

  const results = items
    .map((item) => {
      const targetStrings = getKeys(item)
      let maxScore: number | null = null

      for (const target of targetStrings) {
        const score = getFuzzyScore(query, target)
        if (score !== null) {
          if (maxScore === null || score > maxScore) {
            maxScore = score
          }
        }
      }

      return { item, score: maxScore }
    })
    .filter((result) => result.score !== null) as { item: T; score: number }[]

  return results.sort((a, b) => b.score - a.score).map((result) => result.item)
}
