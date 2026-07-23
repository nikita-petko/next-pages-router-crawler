import { useMemo } from 'react';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import type RAQIV2ChartContext from '../types/RAQIV2ChartContext';
import { snapToLatestEndTime, snapToLatestStartTime } from '../utils/snapToLatestTimestep';

const getMaxEndDate = (latestAvailableTime: Date | null, endTime: Date) => {
  return latestAvailableTime
    ? new Date(Math.min(latestAvailableTime.getTime(), endTime.getTime()))
    : endTime;
};

const useTimeAxisSpecFromChartContext = ({
  chartContext,
}: {
  chartContext: RAQIV2ChartContext;
}): { startDate: Date; endDate: Date } => {
  const {
    timeSpec: { startTime, endTime, snapGranularity },
    granularity: givenGranularity,
    timeAxisBounds,
  } = chartContext;
  const { maxEndDate } = useAnalyticsCurrentDateRangeBundle();

  const granularity = useMemo(
    () => snapGranularity ?? givenGranularity,
    [givenGranularity, snapGranularity],
  );

  const { startDate, endDate } = useMemo(() => {
    if (timeAxisBounds && timeAxisBounds !== 'disabled') {
      return {
        startDate: timeAxisBounds[0],
        endDate: timeAxisBounds[1],
      };
    }

    return {
      startDate: snapToLatestStartTime(startTime, granularity),
      endDate: snapToLatestEndTime(getMaxEndDate(maxEndDate, endTime), granularity),
    };
  }, [timeAxisBounds, maxEndDate, endTime, startTime, granularity]);

  return useMemo(() => {
    const truncatedEndDate = new Date(endDate);
    switch (granularity) {
      case RAQIV2MetricGranularity.OneDay:
      case RAQIV2MetricGranularity.OneMonth:
      case RAQIV2MetricGranularity.OneWeek: {
        break;
      }
      case RAQIV2MetricGranularity.OneHour:
      case RAQIV2MetricGranularity.HalfHour:
      case RAQIV2MetricGranularity.OneMinute:
      case RAQIV2MetricGranularity.None:
        break;
      default: {
        const exhaustiveCheck: never = granularity;
        throw new Error(`Unhandled granularity: ${exhaustiveCheck}`);
      }
    }
    return {
      startDate,
      endDate: truncatedEndDate,
    };
  }, [endDate, granularity, startDate]);
};

export default useTimeAxisSpecFromChartContext;
