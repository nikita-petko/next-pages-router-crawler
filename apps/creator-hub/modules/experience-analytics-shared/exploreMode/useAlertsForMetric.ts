import { useMemo } from 'react';
import useAnalyticsAlertsListQuery from '@modules/experience-alerts/hooks/useAnalyticsAlertsListQuery';
import type { TRAQIV2NumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';

export type AlertForMetric = {
  alertId: string;
  name: string;
};

const EMPTY_ALERTS: readonly AlertForMetric[] = [];

/**
 * List the configured alerts for the given universe whose `alert.metric`
 * targets `metric`.
 *
 * The alert control plane's `listAlerts` doesn't accept a metric filter, so
 * we fetch every alert for the universe (cached for `ANALYTICS_ALERT_LIST_STALE_TIME_MS`)
 * and narrow client-side. The Explore Mode "Alerts" cascading sub-menu uses
 * this list to populate its checkbox rows; it is intentionally **not** the
 * union of "alerts that fired in the current time range" — Explore should
 * surface every alert the user could pin, not only the ones with active
 * incidents (an empty list there would surprise users who configured an
 * alert that never fired).
 *
 * Pass `metric === null` (e.g. before the user picks a metric in Explore
 * Mode) to short-circuit to an empty list without firing the underlying
 * query against an unknown universe.
 */
const useAlertsForMetric = (
  universeId: number | undefined,
  metric: TRAQIV2NumericUIMetric | null,
): { alerts: readonly AlertForMetric[]; isLoading: boolean } => {
  const { data, isLoading } = useAnalyticsAlertsListQuery(metric == null ? undefined : universeId);

  const alerts = useMemo<readonly AlertForMetric[]>(() => {
    if (!metric || !data || data.length === 0) {
      return EMPTY_ALERTS;
    }
    return data
      .filter((alert) => alert.metric === metric)
      .map((alert) => ({ alertId: alert.alertId, name: alert.name }));
  }, [data, metric]);

  return useMemo(() => ({ alerts, isLoading }), [alerts, isLoading]);
};

export { EMPTY_ALERTS };
export default useAlertsForMetric;
