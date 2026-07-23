import { useMemo } from 'react';
import { RAQIV2MetricGranularity, type TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import type { ChartResource as RAQIV2ChartResource } from '@modules/clients/analytics/analyticsRAQIShared';
import legacyFiltersToRAQIV2 from '../adapters/legacyFiltersToRAQIV2';
import type { TChartConfiguratorMetrics } from '../chartConfigurator/chartConfiguratorMetricsConfig';
import getSharedGranularityOptionsForMetrics from '../chartConfigurator/getSharedGranularityOptionsForMetrics';
import { useAnalyticsCurrentBreakdownBundle } from '../context/AnalyticsCurrentBreakdownBundleProvider';
import { useAnalyticsCurrentGranularityNullable } from '../context/AnalyticsCurrentGranularityProvider';
import { useFilterBreakdownConstraintForExplore } from '../hooks/useFilterBreakdownCorrelation';
import type RAQIV2ChartContext from '../types/RAQIV2ChartContext';

const useCurrentChartContext = ({
  metric,
  constraintMetrics,
  resource,
  dimensions,
  filterDimensions,
  chartContextOverride,
}: {
  metric: TChartConfiguratorMetrics | null;
  constraintMetrics?: readonly TChartConfiguratorMetrics[];
  resource: RAQIV2ChartResource;
  dimensions: readonly TRAQIV2Dimension[];
  // Optional superset of `dimensions` used solely for resolving filters from
  // URL query params. This lets explore mode include filters for dimensions
  // that aren't valid breakdowns (e.g. CustomEventName, AggregationType for
  // CustomEventsV2) so they still get carried into the chart request.
  filterDimensions?: readonly TRAQIV2Dimension[];
  chartContextOverride?: RAQIV2ChartContext;
}): RAQIV2ChartContext => {
  const { breakdown: supportedBreakdown } = useAnalyticsCurrentBreakdownBundle(dimensions);

  const { breakdown, filter: legacyFilters } = useFilterBreakdownConstraintForExplore({
    breakdown: supportedBreakdown,
    dimensions,
    filterDimensions,
  });
  const { startDate, endDate, rangeType } = useAnalyticsCurrentDateRangeBundle();
  const granularityFromContext = useAnalyticsCurrentGranularityNullable();
  // TODO(DSA-5051 follow-up): computed metric granularity flutters during formula editing.
  // When a formula is partial (e.g. "A /"), constraintMetrics may transiently exclude
  // metrics that were just referenced, causing the allowed granularities to widen then
  // re-narrow when the formula is completed. This can cause the selected granularity to
  // jump (e.g. daily → weekly → daily) as the user types.
  const metricsForGranularity = useMemo<readonly TChartConfiguratorMetrics[]>(() => {
    if (constraintMetrics?.length) {
      return constraintMetrics;
    }
    return metric ? [metric] : [];
  }, [constraintMetrics, metric]);

  const granularity = useMemo(() => {
    if (!metricsForGranularity.length) {
      // If no metric is provided, use the context granularity if available, otherwise default to oneDay.
      return granularityFromContext ?? RAQIV2MetricGranularity.OneDay;
    }

    const allowedGranularities = getSharedGranularityOptionsForMetrics({
      metrics: metricsForGranularity,
      startDate,
      endDate,
      breakdown,
    });

    // Use context granularity if it is allowed for the current metric and date/breakdown combination.
    if (granularityFromContext && allowedGranularities.includes(granularityFromContext)) {
      return granularityFromContext;
    }

    // Otherwise, use the first available allowed granularity if one exists.
    if (allowedGranularities.length) {
      return allowedGranularities[0];
    }

    // Multi-metric (computed metrics): preserve the selected granularity so the
    // granularity control can render it as unsupported with an explanatory tooltip.
    // Single-metric: fall back to oneDay (this path should not normally be reachable
    // for a single metric).
    if (metricsForGranularity.length > 1 && granularityFromContext) {
      return granularityFromContext;
    }
    return RAQIV2MetricGranularity.OneDay;
  }, [breakdown, endDate, granularityFromContext, metricsForGranularity, startDate]);

  return useMemo(() => {
    return {
      resource,
      timeSpec: {
        startTime: startDate,
        endTime: endDate,
        rangeType,
      },
      granularity,
      filter: legacyFiltersToRAQIV2(legacyFilters),
      breakdown,
      timeAxisBounds: null,
      ...chartContextOverride,
    };
  }, [
    breakdown,
    chartContextOverride,
    endDate,
    granularity,
    legacyFilters,
    rangeType,
    resource,
    startDate,
  ]);
};
export default useCurrentChartContext;
