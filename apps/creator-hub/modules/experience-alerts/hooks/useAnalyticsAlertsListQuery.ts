import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  ANALYTICS_ALERT_LIST_STALE_TIME_MS,
  analyticsAlertsListQueryKey,
  useAnalyticsAlertClientOrNull,
  type AnalyticsAlertsListOptions,
} from '../components/AnalyticsAlertClientProvider';
import { AnalyticsAlertConfigState, type AnalyticsAlertDetail } from '../constants/types';

const SYNCING_POLL_INTERVAL_MS = 3_000;

export default function useAnalyticsAlertsListQuery(
  universeId: number | undefined,
  options?: AnalyticsAlertsListOptions,
): UseQueryResult<AnalyticsAlertDetail[]> {
  const alertClient = useAnalyticsAlertClientOrNull();
  return useQuery({
    queryKey: analyticsAlertsListQueryKey(universeId, options),
    queryFn: () => {
      if (alertClient === null) {
        throw new Error('useAnalyticsAlertsListQuery requires an AnalyticsAlertClientProvider');
      }
      return alertClient.listAlerts(universeId, options);
    },
    enabled:
      alertClient !== null &&
      !!universeId &&
      universeId > 0 &&
      (!options?.ids || options.ids.length > 0),
    staleTime: ANALYTICS_ALERT_LIST_STALE_TIME_MS,
    refetchInterval: ({ state }) =>
      state.data?.some((alert) => alert.configState === AnalyticsAlertConfigState.Syncing)
        ? SYNCING_POLL_INTERVAL_MS
        : false,
  });
}
