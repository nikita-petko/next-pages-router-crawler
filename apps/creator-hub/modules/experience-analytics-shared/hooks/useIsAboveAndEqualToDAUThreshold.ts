import { useQuery } from '@tanstack/react-query';
import { ChartResourceType } from '@modules/charts-generic';
import { RAQIV2MetricGranularity, RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import { useCallback, useMemo } from 'react';
import { useRAQIV2Client } from '../context/RAQIV2ClientProvider';
import makeRAQIV2Request from '../utils/makeRAQIV2Request';
import { snapToLatestStartTime } from '../utils/snapToLatestTimestep';
import useMetricLatestAvailableTime from './useMetricLatestAvailableTime';
import { RAQIV2QueryResponses } from '../utils/combineRAQIV2QueryResponses';

/**
 * Check if the DAU of the universe is above and equal to the threshold.
 * This hook uses the latest available day's DAU to determine if the DAU is above and equal to the threshold.
 */
const useIsAboveAndEqualToDAUThreshold = (universeId: number, threshold: number) => {
  const { client } = useRAQIV2Client(false);

  const { data: latestAvailableTime, isPending: isLoadingLatestAvailableTime } =
    useMetricLatestAvailableTime(RAQIV2Metric.DailyActiveUsers);

  const select = useCallback(({ response }: RAQIV2QueryResponses) => {
    return response?.values?.[0]?.dataPoints?.[0]?.value ?? null;
  }, []);

  const { data: DAU, isPending: isLoadingDAU } = useQuery({
    queryKey: ['DAU-latest-single-date', universeId],
    queryFn: async () => {
      const singleDate = snapToLatestStartTime(
        latestAvailableTime!,
        RAQIV2MetricGranularity.OneDay,
      );
      return makeRAQIV2Request(
        {
          metric: RAQIV2Metric.DailyActiveUsers,
          resource: {
            type: ChartResourceType.Universe,
            id: universeId,
          },
          timeSpec: {
            startTime: singleDate,
            endTime: singleDate,
          },
          granularity: RAQIV2MetricGranularity.None,
        },
        client,
        {
          allowComputedMetrics: false,
        },
      );
    },
    select,
    enabled: !isLoadingLatestAvailableTime && !!latestAvailableTime,
  });

  return useMemo(
    () => ({
      isAboveAndEqualToDAUThreshold: !!DAU && DAU >= threshold,
      isLoadingDAU: isLoadingLatestAvailableTime || isLoadingDAU,
    }),
    [DAU, threshold, isLoadingLatestAvailableTime, isLoadingDAU],
  );
};

export default useIsAboveAndEqualToDAUThreshold;
