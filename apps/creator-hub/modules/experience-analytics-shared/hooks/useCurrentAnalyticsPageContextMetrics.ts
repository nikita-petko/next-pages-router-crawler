import { useMemo } from 'react';
import { RAQIV2Metric, RAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2APIMetric } from '@rbx/creator-hub-analytics-config';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { useRAQIV2ConfigurablePageSurfaceContextMetricsOrNull } from '../components/RAQIV2/layout/RAQIV2ConfigurablePageContext';
import { deserializeComputedMetricFromQueryParam } from '../types/ComputedMetricQueryParam';
import { getAPIMetricFromUIMetric } from '../utils/getAPIMetricFromUIMetric';

const metricParams = [AnalyticsQueryParams.Metric, AnalyticsQueryParams.ComputedMetric];

const resolveSingleMetric = (rawMetric: unknown): TRAQIV2APIMetric | null => {
  if (typeof rawMetric !== 'string') {
    return null;
  }
  if (isValidEnumValue(RAQIV2Metric, rawMetric)) {
    return rawMetric;
  }
  if (isValidEnumValue(RAQIV2UIMetric, rawMetric)) {
    return getAPIMetricFromUIMetric(rawMetric, {
      percentile: null,
      aggregationType: null,
    });
  }
  return null;
};

const useCurrentAnalyticsPageContextMetrics = (): Array<TRAQIV2APIMetric> | null => {
  const [
    {
      [AnalyticsQueryParams.Metric]: exploreModeQueryMetric,
      [AnalyticsQueryParams.ComputedMetric]: exploreModeQueryComputedMetric,
    },
  ] = useQueryParams(metricParams);
  const contextResult = useRAQIV2ConfigurablePageSurfaceContextMetricsOrNull();

  // The computed metric URL param encodes a formula whose `sources` carry the
  // metrics that were actually queried. Unpacking them here means a chart-level
  // dynamic filter (e.g., TransactionType) gets a well-defined metric context
  // for its options query when the user is in operations / equation-builder
  // mode — without the chart needing to wrap the drawer in a dedicated
  // SourceMetricContextProvider.
  const computedMetricResult = useMemo((): Array<TRAQIV2APIMetric> | null => {
    if (typeof exploreModeQueryComputedMetric !== 'string') {
      return null;
    }
    const parsed = deserializeComputedMetricFromQueryParam(exploreModeQueryComputedMetric);
    if (!parsed?.sources.length) {
      return null;
    }
    const seen = new Set<TRAQIV2APIMetric>();
    const resolved: TRAQIV2APIMetric[] = [];
    parsed.sources.forEach((source) => {
      const apiMetric = resolveSingleMetric(source.metric);
      if (apiMetric && !seen.has(apiMetric)) {
        seen.add(apiMetric);
        resolved.push(apiMetric);
      }
    });
    return resolved.length > 0 ? resolved : null;
  }, [exploreModeQueryComputedMetric]);

  const exploreModeResult = useMemo((): Array<TRAQIV2APIMetric> | null => {
    const apiMetric = resolveSingleMetric(exploreModeQueryMetric);
    return apiMetric ? [apiMetric] : null;
  }, [exploreModeQueryMetric]);

  const nonExploreModeResult = useMemo(() => {
    if (contextResult?.length) {
      return contextResult;
    }

    return null;
  }, [contextResult]);

  // Precedence: an explicitly-provided page surface context (set by
  // RAQIV2ConfigurablePageSurfaceContextProvider or SourceMetricContextProvider)
  // wins; otherwise prefer a computed-metric URL param (operations mode) over a
  // single-metric URL param (chart mode).
  return nonExploreModeResult ?? computedMetricResult ?? exploreModeResult;
};

export default useCurrentAnalyticsPageContextMetrics;
