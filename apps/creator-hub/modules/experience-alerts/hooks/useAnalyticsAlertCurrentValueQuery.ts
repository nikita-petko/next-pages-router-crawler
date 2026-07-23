import { useEffect, useMemo, useState } from 'react';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import { getCurrentDate, subMinutes } from '@modules/charts-generic/utils/dateUtils';
import { ChartResourceType } from '@modules/clients/analytics/analyticsRAQIShared';
import type { TUseApiRequestResponse } from '@modules/experience-analytics-shared/hooks/useApiRequest';
import useRAQIV2Request from '@modules/experience-analytics-shared/hooks/useRAQIV2Request';
import type { RAQIV2UIQueryRequest } from '@modules/experience-analytics-shared/types/RAQIV2UIQueryRequest';
import type { RAQIV2QueryResponses } from '@modules/experience-analytics-shared/utils/combineRAQIV2QueryResponses';
import { getAlertGranularityStepMinutes } from '../constants/alertFormConstants';
import type { AnalyticsAlertDetail } from '../constants/types';

const MINUTE_MS = 60_000;

// The current minute's metrics aren't ingested yet, so query slightly in the
// past to avoid empty datapoints in the current-value column. Mirrors the
// offset used by `PerformanceRealtimeCard`'s `metricStatsTime`.
const METRIC_STATS_OFFSET_MINUTES = 2;

/**
 * Fetches the latest data point for an alert's metric/filter/breakdown at a
 * single timestamp `METRIC_STATS_OFFSET_MINUTES` in the past. Used by
 * `ActiveAlertCurrentValueCell` to render the "Current Value" column.
 * Returns one `RAQIV2MetricValue` per breakdown combination.
 *
 * Refreshes on a fixed cadence equal to the alert's granularity step (1 min
 * for 1-min alerts, 5 min for 5-min alerts, …) so the value stays current
 * without a page reload. The tick is listed as a `useMemo` dep so each
 * interval fire re-derives the `timeSpec` and triggers a refetch downstream.
 */
export default function useAnalyticsAlertCurrentValueQuery(
  alert: AnalyticsAlertDetail,
): TUseApiRequestResponse<RAQIV2QueryResponses> {
  const { universeId, metric, filter, breakdown, granularity } = alert;
  const stepMinutes = getAlertGranularityStepMinutes(granularity);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), stepMinutes * MINUTE_MS);
    return () => clearInterval(id);
  }, [stepMinutes]);

  const request = useMemo<RAQIV2UIQueryRequest>(() => {
    const metricStatsTime = subMinutes(getCurrentDate(), METRIC_STATS_OFFSET_MINUTES);
    return {
      resource: { type: ChartResourceType.Universe, id: universeId },
      metric,
      granularity,
      breakdown,
      filter,
      timeSpec: {
        rangeType: RAQIV2DateRangeType.Custom,
        startTime: metricStatsTime,
        endTime: metricStatsTime,
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `tick` is the polling heartbeat; bumping it re-derives `metricStatsTime` and triggers a refetch
  }, [universeId, metric, granularity, breakdown, filter, tick]);

  return useRAQIV2Request(request);
}
