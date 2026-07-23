import { useCallback, useMemo } from 'react';
import { RAQIV2Metric, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import type {
  AnalyticsBenchmarkClientWrapper,
  AnalyticsBenchmarkQuery,
} from '@modules/clients/analytics';
import { AnalyticsBenchmarkType } from '@modules/clients/analytics';
import { useCachedAnalyticsBenchmark } from '../context/AnalyticsBenchmarkProvider';
import { snapToLatestEndTime, snapToLatestStartTime } from '../utils/snapToLatestTimestep';
import useApiRequest from './useApiRequest';
import { useUniverseResource } from './useChartResourceProvider';

const useCurrentBenchmarkType = (
  client: AnalyticsBenchmarkClientWrapper,
  query: AnalyticsBenchmarkQuery | null,
): AnalyticsBenchmarkType | null => {
  const makeBenchmarkRequest = useCallback(async () => {
    if (!query) {
      return null;
    }
    return client.query(query);
  }, [query, client]);

  const { data } = useApiRequest(makeBenchmarkRequest);

  return useMemo(
    () => data?.result?.values?.[0]?.dataPoints?.[0]?.metadata?.benchmarkType ?? null,
    [data],
  );
};

const useCurrentBenchmarkTypeIsSimilarityForExperiencesList = () => {
  const { id: universeId } = useUniverseResource();
  const { startDate, endDate } = useAnalyticsCurrentDateRangeBundle();

  const { client } = useCachedAnalyticsBenchmark();
  // Querying one of the metrics on page to get the benchmark type
  const benchmarkQuery: AnalyticsBenchmarkQuery | null = useMemo(
    () =>
      universeId
        ? {
            startTime: snapToLatestStartTime(startDate, RAQIV2MetricGranularity.OneDay),
            endTime: snapToLatestEndTime(endDate, RAQIV2MetricGranularity.OneDay),
            metric: RAQIV2Metric.RFYL7PlayDays,
            resourceId: universeId.toString(),
            resourceType: ChartResourceType.Universe,
          }
        : null,
    [endDate, startDate, universeId],
  );

  const benchmarkType = useCurrentBenchmarkType(client, benchmarkQuery);
  return useMemo(() => benchmarkType === AnalyticsBenchmarkType.Similarity, [benchmarkType]);
};

export default useCurrentBenchmarkTypeIsSimilarityForExperiencesList;
