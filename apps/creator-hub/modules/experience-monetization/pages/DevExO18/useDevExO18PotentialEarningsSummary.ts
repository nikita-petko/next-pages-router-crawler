import { useMemo } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { getCurrentDate, subHours } from '@modules/charts-generic/utils/dateUtils';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { RAQIV2SummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import type RAQIV2ChartSpec from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';
import useDevExO18MetricSummary from './useDevExO18MetricSummary';

const DEVEX_O18_LOOKBACK_HOURS = 30 * 24;

// Fetches the DevEx O18 "potential extra earnings" total over the last 30 days
// for a universe — the same value the analytics section's summary shows. Must be
// rendered within an RAQIV2ClientProvider (analytics query gateway).
const useDevExO18PotentialEarningsSummary = (universeId: number) => {
  const spec: RAQIV2ChartSpec = useMemo(() => {
    const endTime = getCurrentDate();
    const startTime = subHours(endTime, DEVEX_O18_LOOKBACK_HOURS);
    return {
      resource: { type: RAQIV2ChartResourceType.Universe, id: universeId },
      metric: RAQIV2Metric.PotentialExtraEarningsTotalUsd,
      timeSpec: { rangeType: RAQIV2DateRangeType.Custom, startTime, endTime },
      timeAxisBounds: 'disabled',
      granularity: RAQIV2MetricGranularity.None,
      filter: [],
    };
  }, [universeId]);

  return useDevExO18MetricSummary(spec, { type: RAQIV2SummaryType.Total });
};

export default useDevExO18PotentialEarningsSummary;
