import { useCallback, useMemo } from 'react';
import useQueryParams from '@modules/miscellaneous/hooks/useQueryParams';

export const VIEW_QUERY_KEY = 'view' as const;
const QUERY_KEYS = [VIEW_QUERY_KEY] as const;
const TRANSITION_OPTIONS = { scroll: false };

export const ARCHIVE_VIEWS = ['current', 'archived'] as const;
export type ArchiveView = (typeof ARCHIVE_VIEWS)[number];

/**
 * URL-driven view state, the `?view=` sibling of `useTabs`.
 *
 * Reads `?view=` and validates it against the provided view values, falling back to
 * `defaultView` (or the first value) when missing or unrecognized. Selecting the default
 * clears the param so the URL stays clean. Updates are shallow and do not scroll.
 *
 * Requires at least one view to be provided.
 */
export function useView<T extends string>(
  views: readonly T[],
  defaultView?: T,
): { view: T; setView: (view: T) => void } {
  const [queryParams, setQueryParams] = useQueryParams(QUERY_KEYS, TRANSITION_OPTIONS);
  const fallback = defaultView ?? views[0];

  const view = useMemo(() => {
    const raw = queryParams[VIEW_QUERY_KEY];
    const value = Array.isArray(raw) ? raw[0] : raw;
    return views.find((candidate) => candidate === value) ?? fallback;
  }, [queryParams, views, fallback]);

  const setView = useCallback(
    (next: T) => {
      setQueryParams({ [VIEW_QUERY_KEY]: next === fallback ? null : next });
    },
    [fallback, setQueryParams],
  );

  return { view, setView };
}
