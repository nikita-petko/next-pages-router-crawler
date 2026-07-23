import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import {
  ANALYTICS_ALERT_LIST_STALE_TIME_MS,
  analyticsAlertIncidentsQueryKey,
  useAnalyticsAlertClientOrNull,
  type AnalyticsAlertIncidentsListOptions,
} from '../components/AnalyticsAlertClientProvider';
import type { AnalyticsAlertIncidentDetail } from '../constants/types';

export default function useAnalyticsAlertIncidentsQuery(
  universeId: number | undefined,
  chartContext: RAQIV2ChartContext | undefined,
  options?: AnalyticsAlertIncidentsListOptions,
): UseQueryResult<AnalyticsAlertIncidentDetail[]> {
  const alertClient = useAnalyticsAlertClientOrNull();

  return useQuery({
    queryKey: analyticsAlertIncidentsQueryKey(universeId, chartContext, options),
    queryFn: () => {
      if (alertClient === null) {
        throw new Error('useAnalyticsAlertIncidentsQuery requires an AnalyticsAlertClientProvider');
      }
      return alertClient.listAlertIncidents(universeId, chartContext, options);
    },
    enabled: alertClient !== null && chartContext != null && universeId != null && universeId > 0,
    staleTime: ANALYTICS_ALERT_LIST_STALE_TIME_MS,
  });
}
