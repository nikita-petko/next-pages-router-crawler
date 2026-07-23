import { useState, useMemo, useCallback } from 'react';

/**
 * Scores and filters an array of objects based on a tokenized search query.
 * Simplified fuzzy search.
 *
 * Might eventually allow searching across multiple fields, but for now, only one field is supported.
 */
export function searchItems<T>(items: T[], query: string, field: keyof T): T[] {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return items;

  const queryTokens = trimmedQuery.split(/\s+/);

  const results = items.map((item) => {
    const fieldValue = String(item[field] || '').toLowerCase();
    const fieldTokens = fieldValue.split(/\s+/);

    let totalScore = 0;

    // eslint-disable-next-line no-restricted-syntax -- for-of is better
    for (const token of queryTokens) {
      let bestTokenScore = 0;

      if (fieldValue === token) {
        // 1. Exact full string match
        bestTokenScore = 100;
      } else if (fieldTokens.some((word) => word === token)) {
        // 2. Exact word match
        bestTokenScore = 50;
      } else if (fieldTokens.some((word) => word.startsWith(token))) {
        // 3. Prefix match (No length guard: "g" will successfully match "Gold")
        bestTokenScore = 20;
      } else if (token.length > 1 && fieldValue.includes(token)) {
        // 4. Substring match (Guarded: prevents single letters like "e" from matching everything)
        bestTokenScore = 5;
      } else if (
        token.length === 1 &&
        queryTokens.length > 1 &&
        fieldTokens.some((word) => word.includes(token))
      ) {
        // 5. Single-char word-level match, only in multi-token queries
        //    e.g. "Gold Shoes A" matches "Gold Shoes 11A" because "a" is inside "11a"
        bestTokenScore = 5;
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
 * @param searchField - The object key to perform the search against.
 *
 * @example
 * ```tsx
 * type Product = { id: number; name: string; type: string; };
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
 *   } = useSearch(products, 'name');
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
export function useTokenizedSearch<T extends object>(items: T[], searchField: keyof T) {
  const [searchQuery, setSearchQuery] = useState('');

  const results = useMemo(() => {
    return searchItems(items, searchQuery, searchField);
  }, [items, searchQuery, searchField]);

  const clearSearch = useCallback(() => setSearchQuery(''), []);

  return {
    searchQuery,
    setSearchQuery,
    clearSearch,
    results,
  } as const;
}
