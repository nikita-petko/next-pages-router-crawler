import { useCallback, useMemo } from 'react';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { BenchmarkType } from '../constants/BenchmarkType';
import type { BenchmarkOverlayType } from './useAnalyticsBenchmarks';
import {
  getBenchmarkQuery,
  hasAnyBenchmarks,
  mapApiBenchmarkTypeToOverlayType,
} from './useAnalyticsBenchmarks';
import { useCachedAnalyticsBenchmark } from '../context/AnalyticsBenchmarkProvider';
import useApiRequest from './useApiRequest';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import { getRAQIV2BenchmarkMetricFromMetricLike } from '../utils/metricLikeSemantics';

const OrderedBenchmarkOverlayTypes: readonly BenchmarkOverlayType[] = [
  BenchmarkType.Similarity,
  BenchmarkType.Genre,
];

type UseAvailableBenchmarkTypesResult = {
  availableBenchmarkTypes: readonly BenchmarkOverlayType[];
  isLoading: boolean;
  hasAnyBenchmarkData: boolean;
};

/**
 * Determines which benchmark overlay types are available for a given chart spec
 * by reading the `availableTypes` field from a single benchmark API response.
 */
const useAvailableBenchmarkTypes = (
  spec: RAQIV2ChartSpec | null,
): UseAvailableBenchmarkTypesResult => {
  const { isCreatorRewardsBenchmarksEnabled, isFetched } = useFeatureFlagsForNamespace(
    'isCreatorRewardsBenchmarksEnabled',
    FeatureFlagNamespace.Analytics,
  );

  const baseQuery = useMemo(() => {
    if (!spec) {
      return null;
    }

    const benchmarkMetric = getRAQIV2BenchmarkMetricFromMetricLike(spec.metric);
    if (
      benchmarkMetric === RAQIV2Metric.SourceCountRatioKpi &&
      (!isCreatorRewardsBenchmarksEnabled || !isFetched)
    ) {
      return null;
    }

    return getBenchmarkQuery(spec);
  }, [isCreatorRewardsBenchmarksEnabled, isFetched, spec]);

  const { client } = useCachedAnalyticsBenchmark();

  const makeBenchmarkRequest = useCallback(async () => {
    if (!baseQuery) {
      return null;
    }
    try {
      return await client.query(baseQuery);
    } catch {
      return null;
    }
  }, [baseQuery, client]);

  const { data, isDataLoading } = useApiRequest(makeBenchmarkRequest);

  return useMemo(() => {
    const apiTypes = data?.availableTypes ?? [];
    const overlayTypes = new Set(
      apiTypes
        .map((t) => mapApiBenchmarkTypeToOverlayType(t))
        .filter((t): t is BenchmarkOverlayType => t !== null),
    );
    const availableBenchmarkTypes = OrderedBenchmarkOverlayTypes.filter((t) => overlayTypes.has(t));
    return {
      availableBenchmarkTypes,
      isLoading: isDataLoading,
      hasAnyBenchmarkData: hasAnyBenchmarks(data?.result ?? null),
    };
  }, [data, isDataLoading]);
};

export default useAvailableBenchmarkTypes;
