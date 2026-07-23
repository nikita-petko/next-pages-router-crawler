import { useState, useMemo, useCallback } from 'react';

type PrecomputedField = {
  value: string;
  tokens: string[];
};

/**
 * Scores a single query token against one precomputed field, using the same
 * tiered fuzzy logic for every field. Returns 0 when the token does not match.
 */
function scoreTokenAgainstField(
  token: string,
  { value, tokens }: PrecomputedField,
  queryTokenCount: number,
): number {
  if (value === token) {
    // 1. Exact full string match
    return 100;
  }
  if (tokens.some((word) => word === token)) {
    // 2. Exact word match
    return 50;
  }
  if (tokens.some((word) => word.startsWith(token))) {
    // 3. Prefix match (No length guard: "g" will successfully match "Gold")
    return 20;
  }
  if (token.length > 1 && value.includes(token)) {
    // 4. Substring match (Guarded: prevents single letters like "e" from matching everything)
    return 5;
  }
  if (token.length === 1 && queryTokenCount > 1 && tokens.some((word) => word.includes(token))) {
    // 5. Single-char word-level match, only in multi-token queries
    //    e.g. "Gold Shoes A" matches "Gold Shoes 11A" because "a" is inside "11a"
    return 5;
  }
  return 0;
}

/**
 * Scores and filters an array of objects based on a tokenized search query.
 * Simplified fuzzy search.
 *
 * Each query token is scored against every search field and keeps its best
 * (max) field score, so a token matching multiple fields is never counted
 * twice. Strict AND semantics apply across tokens: every token must match at
 * least one field, otherwise the item is excluded. With an empty field list a
 * non-empty query matches nothing.
 *
 * `null`/`undefined` field values are treated as empty strings, while other
 * values (including numeric `0`) are stringified and remain searchable.
 */
export function searchItems<T>(
  items: T[],
  query: string,
  searchFields: keyof T | readonly (keyof T)[],
): T[] {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) {
    return items;
  }

  const fields: readonly (keyof T)[] = Array.isArray(searchFields) ? searchFields : [searchFields];
  const queryTokens = trimmedQuery.split(/\s+/);

  const results = items.map((item) => {
    const precomputedFields: PrecomputedField[] = fields.map((field) => {
      const value = String(item[field] ?? '').toLowerCase();
      return { value, tokens: value.split(/\s+/) };
    });

    let totalScore = 0;

    for (const token of queryTokens) {
      let bestTokenScore = 0;

      for (const precomputedField of precomputedFields) {
        const fieldScore = scoreTokenAgainstField(token, precomputedField, queryTokens.length);
        if (fieldScore > bestTokenScore) {
          bestTokenScore = fieldScore;
        }
      }

      // Strict AND logic: If any word the user typed isn't found, fail the whole item
      if (bestTokenScore === 0) {
        totalScore = 0;
        break;
      }

      totalScore += bestTokenScore;
    }

    return { item, score: totalScore };
  });

  return results
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.item);
}

/**
 * Hook to provide state management and tokenized searching for an array of objects.
 *
 * @template T - The type of objects in the array.
 *
 * @param items - The array of objects to search through.
 * @param searchFields - The object key, or readonly array of keys, to search
 *   against. When passing an array, keep it referentially stable (e.g. a
 *   module-level constant) so the memoized results are not recomputed on every
 *   render.
 *
 * @example
 * ```tsx
 * type Product = { id: number; name: string; type: string; };
 *
 * const SEARCH_FIELDS = ['name', 'id'] as const satisfies readonly (keyof Product)[];
 *
 * const products: Product[] = [
 *   { id: 1, name: "VIP Game Pass", type: "GamePass" },
 *   { id: 2, name: "Gold Sword", type: "DeveloperProduct" }
 * ];
 *
 * export function ProductList(props: { products: Product[] }) {
 *   const {
 *     searchQuery,
 *     setSearchQuery,
 *     results
 *   } = useTokenizedSearch(products, SEARCH_FIELDS);
 *
 *   return (
 *     <div>
 *       <input
 *         type="text"
 *         value={searchQuery}
 *         onChange={(e) => setSearchQuery(e.target.value)}
 *         placeholder="Search products..."
 *       />
 *       <ul>
 *         {results.map(product => (
 *           <li key={product.id}>{product.name}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTokenizedSearch<T extends object>(
  items: T[],
  searchFields: keyof T | readonly (keyof T)[],
) {
  const [searchQuery, setSearchQuery] = useState('');

  const results = useMemo(() => {
    return searchItems(items, searchQuery, searchFields);
  }, [items, searchQuery, searchFields]);

  const clearSearch = useCallback(() => setSearchQuery(''), []);

  return {
    searchQuery,
    setSearchQuery,
    clearSearch,
    results,
  } as const;
}
