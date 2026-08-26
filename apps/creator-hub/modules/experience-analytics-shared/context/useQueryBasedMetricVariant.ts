import { useCallback, useEffect, useMemo } from 'react';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { RAQIV2Dimension, RAQIV2UIPseudoDimension } from '@rbx/creator-hub-analytics-config';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import useMetricVariantChartStateEnabled from '../hooks/useMetricVariantChartStateEnabled';
import {
  deserializeMetricVariantFanout,
  isMetricVariantFanout,
  serializeMetricVariantFanout,
  splitMetricVariantFromBreakdown,
  type MetricVariantFanout,
} from '../utils/metricVariant';

const isSupportedBreakdownDimension = (value: string): value is TRAQIV2Dimension =>
  isValidEnumValue(RAQIV2Dimension, value) || isValidEnumValue(RAQIV2UIPseudoDimension, value);

const parseBreakdownQueryParam = (
  value: string | string[] | null | undefined,
): TRAQIV2Dimension[] => {
  if (!value) {
    return [];
  }
  const values = Array.isArray(value) ? value : [value];
  return values.filter(isSupportedBreakdownDimension);
};

const metricVariantQueryKeys = [
  AnalyticsQueryParams.MetricVariant,
  AnalyticsQueryParams.Breakdown,
] as const;

export type UseQueryBasedMetricVariantOptions = {
  /**
   * When true, leftover PercentileType / AggregationType breakdown entries are
   * rewritten onto `metricVariant` with `skipHistory` so Back is not trapped
   * on the legacy URL. Only one Explore mount should pass this — the hook is
   * also used from `useCurrentChartContext` as a read-only subscriber.
   */
  canonicalize?: boolean;
};

/**
 * URL-backed page-level metric-variant fanout. When the DSA-6104 flag is on,
 * old links that stuffed PercentileType / AggregationType into `breakdown`
 * are lifted on read and rewritten to `metricVariant`. The query param is
 * still honored when the flag is off so already-migrated URLs keep working.
 */
const useQueryBasedMetricVariant = (
  options: UseQueryBasedMetricVariantOptions = {},
): {
  metricVariant: MetricVariantFanout | null;
  setMetricVariant: (next: MetricVariantFanout | null) => void;
  setBreakdownAndMetricVariant: (nextBreakdown: readonly TRAQIV2Dimension[]) => void;
} => {
  const { canonicalize = false } = options;
  const isMetricVariantChartStateEnabled = useMetricVariantChartStateEnabled();
  const [queryParams, setQueryParams] = useQueryParams(metricVariantQueryKeys);

  const metricVariant = useMemo(() => {
    const fromParam = deserializeMetricVariantFanout(
      queryParams[AnalyticsQueryParams.MetricVariant],
    );
    if (fromParam) {
      return fromParam;
    }
    if (!isMetricVariantChartStateEnabled) {
      return null;
    }
    const { metricVariant: lifted } = splitMetricVariantFromBreakdown(
      undefined,
      parseBreakdownQueryParam(queryParams[AnalyticsQueryParams.Breakdown]),
    );
    return lifted?.mode === 'fanout' ? lifted : null;
  }, [isMetricVariantChartStateEnabled, queryParams]);

  const setMetricVariant = useCallback(
    (next: MetricVariantFanout | null) => {
      setQueryParams({
        [AnalyticsQueryParams.MetricVariant]: serializeMetricVariantFanout(next),
      });
    },
    [setQueryParams],
  );

  const setBreakdownAndMetricVariant = useCallback(
    (nextBreakdown: readonly TRAQIV2Dimension[]) => {
      if (!isMetricVariantChartStateEnabled) {
        setQueryParams({
          [AnalyticsQueryParams.Breakdown]: [...nextBreakdown],
          [AnalyticsQueryParams.MetricVariant]: null,
        });
        return;
      }
      const split = splitMetricVariantFromBreakdown(undefined, nextBreakdown);
      setQueryParams({
        [AnalyticsQueryParams.Breakdown]: split.breakdown,
        [AnalyticsQueryParams.MetricVariant]: serializeMetricVariantFanout(
          isMetricVariantFanout(split.metricVariant) ? split.metricVariant : null,
        ),
      });
    },
    [isMetricVariantChartStateEnabled, setQueryParams],
  );

  useEffect(() => {
    if (
      !canonicalize ||
      !isMetricVariantChartStateEnabled ||
      queryParams[AnalyticsQueryParams.MetricVariant]
    ) {
      return;
    }
    const { metricVariant: lifted, breakdown: stripped } = splitMetricVariantFromBreakdown(
      undefined,
      parseBreakdownQueryParam(queryParams[AnalyticsQueryParams.Breakdown]),
    );
    if (lifted?.mode !== 'fanout') {
      return;
    }
    setQueryParams(
      {
        [AnalyticsQueryParams.MetricVariant]: serializeMetricVariantFanout(lifted),
        [AnalyticsQueryParams.Breakdown]: stripped,
      },
      { skipHistory: true },
    );
  }, [canonicalize, isMetricVariantChartStateEnabled, queryParams, setQueryParams]);

  return { metricVariant, setMetricVariant, setBreakdownAndMetricVariant };
};

export default useQueryBasedMetricVariant;
