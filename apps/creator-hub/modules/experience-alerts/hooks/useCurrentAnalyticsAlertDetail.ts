import { useMemo } from 'react';
import type { AnalyticsAlertsListOptions } from '../components/AnalyticsAlertClientProvider';
import type { AnalyticsAlertDetail } from '../constants/types';
import useAnalyticsAlertsListQuery from './useAnalyticsAlertsListQuery';

export type UseCurrentAnalyticsAlertDetailResult = {
  data: AnalyticsAlertDetail | undefined;
  isLoading: boolean;
  isFetched: boolean;
  isSuccess: boolean;
  isError: boolean;
};

/**
 * Fetches a single alert by id via the shared list query (deduped with other
 * `useAnalyticsAlertsListQuery({ ids: [alertId] })` callers).
 */
export default function useCurrentAnalyticsAlertDetail(
  universeId: number | undefined,
  alertId: string | undefined,
): UseCurrentAnalyticsAlertDetailResult {
  const listOptions = useMemo<AnalyticsAlertsListOptions>(
    () => ({ ids: alertId ? [alertId] : [] }),
    [alertId],
  );

  const {
    data: alertsListData,
    isLoading,
    isFetched,
    isSuccess,
    isError,
  } = useAnalyticsAlertsListQuery(universeId, listOptions);

  const data = useMemo(() => {
    if (!alertId || !alertsListData?.length) {
      return undefined;
    }
    return alertsListData.find((a) => a.alertId === alertId);
  }, [alertId, alertsListData]);

  return { data, isLoading, isFetched, isSuccess, isError };
}
