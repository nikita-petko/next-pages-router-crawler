import { useMemo, useCallback } from 'react';
import { useQueryParams } from '@modules/miscellaneous/hooks';

export const TAB_QUERY_KEY = 'tab' as const;
export const QUERY_KEYS = [TAB_QUERY_KEY] as const;

/**
 * URL-driven tab state hook.
 *
 * Reads `?tab=` from the URL, validates it against the provided tab values,
 * and falls back to `defaultTab` when missing or invalid.
 * Updates the URL on tab change via shallow navigation (no scroll).
 *
 * Requires at least one tab to be provided.
 */
export function useTabs<T extends string>(
  tabs: readonly T[],
  defaultTab?: T,
): { activeTab: T; setActiveTab: (tab: T) => void } {
  const [queryParams, setQueryParams] = useQueryParams(QUERY_KEYS, { scroll: false });

  const activeTab: T = useMemo(() => {
    const raw = queryParams[TAB_QUERY_KEY];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value && (tabs as readonly string[]).includes(value)) {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- intended type check
      return value as T;
    }
    return defaultTab ?? tabs[0];
  }, [queryParams, tabs, defaultTab]);

  const setActiveTab = useCallback(
    (tab: T) => {
      if (!(tabs as readonly string[]).includes(tab)) {
        return;
      }
      setQueryParams({ [TAB_QUERY_KEY]: tab === defaultTab ? null : tab });
    },
    [tabs, defaultTab, setQueryParams],
  );

  return { activeTab, setActiveTab };
}
