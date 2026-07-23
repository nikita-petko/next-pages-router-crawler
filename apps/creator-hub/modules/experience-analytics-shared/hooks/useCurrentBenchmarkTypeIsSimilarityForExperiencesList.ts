import { useCallback, useMemo } from 'react';
import { ChartResourceType, useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic';
import {
  AnalyticsBenchmarkClientWrapper,
  AnalyticsBenchmarkQuery,
  AnalyticsBenchmarkType,
} from '@modules/clients/analytics';
import { RAQIV2Metric, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { snapToLatestEndTime, snapToLatestStartTime } from '../utils/snapToLatestTimestep';
import { useCachedAnalyticsBenchmark } from '../context/AnalyticsBenchmarkProvider';
import { useUniverseResource } from './useChartResourceProvider';
import useApiRequest from './useApiRequest';

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
