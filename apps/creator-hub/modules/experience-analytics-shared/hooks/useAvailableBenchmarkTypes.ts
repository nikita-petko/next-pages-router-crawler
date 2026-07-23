import { useCallback, useMemo } from 'react';
import { BenchmarkType } from '../constants/BenchmarkType';
import { useCachedAnalyticsBenchmark } from '../context/AnalyticsBenchmarkProvider';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import type { BenchmarkOverlayType } from './useAnalyticsBenchmarks';
import {
  getBenchmarkQuery,
  hasAnyBenchmarks,
  mapApiBenchmarkTypeToOverlayType,
} from './useAnalyticsBenchmarks';
import useApiRequest from './useApiRequest';

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
  const baseQuery = useMemo(() => (spec ? getBenchmarkQuery(spec) : null), [spec]);

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
