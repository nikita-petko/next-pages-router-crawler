import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  DEFAULT_SESSION_BROWSER_FILTERS,
  type SessionBrowserFilters,
} from '../types/SessionBrowserFilters';
import {
  syncSessionBrowserFiltersToUrl,
  urlParamsToSessionBrowserFilters,
} from '../utils/urlSessionBrowserFilterParams';

const useSessionBrowserFilters = () => {
  const router = useRouter();

  const filters = useMemo(
    () =>
      router.isReady
        ? urlParamsToSessionBrowserFilters(router.query)
        : DEFAULT_SESSION_BROWSER_FILTERS,
    [router.isReady, router.query],
  );

  const updateFilters = useCallback(
    (nextFilters: SessionBrowserFilters) => {
      syncSessionBrowserFiltersToUrl(router, nextFilters);
    },
    [router],
  );

  return { filters, updateFilters, isUrlReady: router.isReady };
};

export default useSessionBrowserFilters;
