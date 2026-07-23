import { createContext, useContext, type ReactNode } from 'react';

/**
 * Per-category counts (post-edit) for the shop item-catalog category
 * dropdown. Routed through context so a count change doesn't invalidate the
 * `memo()` boundary on `ShopItemsTableRow` — only dropdown subscribers
 * re-render.
 *
 * `undefined` until all items have loaded; consumers gate badge rendering on
 * this so partial-page counts are never shown.
 */
const CategoryCountsContext = createContext<ReadonlyMap<string, number> | undefined>(undefined);
CategoryCountsContext.displayName = 'CategoryCountsContext';

type CategoryCountsProviderProps = {
  counts: ReadonlyMap<string, number> | undefined;
  children: ReactNode;
};

export function CategoryCountsProvider({ counts, children }: CategoryCountsProviderProps) {
  return <CategoryCountsContext.Provider value={counts}>{children}</CategoryCountsContext.Provider>;
}

export function useCategoryCounts(): ReadonlyMap<string, number> | undefined {
  return useContext(CategoryCountsContext);
}
