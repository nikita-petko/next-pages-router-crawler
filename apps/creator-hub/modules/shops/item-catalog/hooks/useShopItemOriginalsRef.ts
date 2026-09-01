import { useRef } from 'react';
import { getShopItemKey, type ShopItem } from '../../types';

/**
 * Maintains a stable lookup of the latest fetched items keyed by
 * `getShopItemKey(item)`. The returned map reference is stable across renders
 * and mutated in place when `items` changes, so consumers can use it as a
 * `useMemo`/`useCallback` dep without thrashing.
 *
 * Used by edit-tracking hooks that need to resolve "what was the server-truth
 * value for this id last time we fetched" without paying the cost of a
 * `.find(...)` per call.
 */
export function useShopItemOriginalsRef(items: ShopItem[]): ReadonlyMap<string, ShopItem> {
  const originalsRef = useRef<Map<string, ShopItem>>(new Map());
  const lastItemsRef = useRef<ShopItem[] | null>(null);
  if (lastItemsRef.current !== items) {
    lastItemsRef.current = items;
    const map = originalsRef.current;
    map.clear();
    for (const item of items) {
      map.set(getShopItemKey(item), item);
    }
  }
  return originalsRef.current;
}
