import { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';

const SHOW_FORECASTER_QUERY_PARAM = 'showForecaster';
const SHOW_FORECASTER_QUERY_VALUE = 'true';

/**
 * Opens/closes the forecast estimator via URL query on the current page.
 */
export const useForecastEstimatorDrawerUrl = () => {
  const router = useRouter();

  const isOpen = useMemo(() => {
    const raw = router.query[SHOW_FORECASTER_QUERY_PARAM];
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value === SHOW_FORECASTER_QUERY_VALUE;
  }, [router.query]);

  const open = useCallback(() => {
    if (!router.isReady) {
      return;
    }
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, [SHOW_FORECASTER_QUERY_PARAM]: SHOW_FORECASTER_QUERY_VALUE },
      },
      undefined,
      { shallow: true },
    );
  }, [router]);

  const close = useCallback(() => {
    if (!router.isReady) {
      return;
    }
    const nextQuery = { ...router.query };
    delete nextQuery[SHOW_FORECASTER_QUERY_PARAM];
    router.replace(
      {
        pathname: router.pathname,
        query: nextQuery,
      },
      undefined,
      { shallow: true },
    );
  }, [router]);

  return { close, isOpen, open };
};
