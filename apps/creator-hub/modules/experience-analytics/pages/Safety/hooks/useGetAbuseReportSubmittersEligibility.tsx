import { useMemo } from 'react';
import { RAQIV2MetricGranularity, RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import {
  RAQIV2ChartContext,
  RAQIV2UIQueryRequest,
  MakeRAQIV2RequestOptions,
  useRAQIV2Request,
  getSummarizeValueForSingleSeries,
} from '@modules/experience-analytics-shared';
import { ChartSummaryType } from '@modules/charts-generic';

const MINIMUM_PLAYTIME_THRESHOLD = 1000;

const useGetAbuseReportSubmittersEligibility = (chartContext: RAQIV2ChartContext) => {
  const eligibilityRequest: RAQIV2UIQueryRequest | null = useMemo(() => {
    return {
      resource: chartContext.resource,
      timeSpec: chartContext.timeSpec,
      granularity: RAQIV2MetricGranularity.OneDay,
      metric: RAQIV2Metric.TotalPlayTimeHours,
    };
  }, [chartContext]);

  const requestOptions: MakeRAQIV2RequestOptions = useMemo(
    () => ({
      fetchTotalSeries: false,
    }),
    [],
  );

  const {
    data: eligibilityData,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    error,
  } = useRAQIV2Request(eligibilityRequest, requestOptions, !eligibilityRequest);

  const requestStatus = useMemo(() => {
    return {
      isDataLoading,
      isResponseFailed,
      isUserForbidden,
      error,
    };
  }, [isDataLoading, isResponseFailed, isUserForbidden, error]);

  const series = useMemo(() => {
    const dataPoints = eligibilityData?.response?.values?.[0]?.dataPoints;
    if (!dataPoints || dataPoints.length === 0) {
      return null;
    }

    return {
      dataPoints: dataPoints.map(
        (dp) =>
          [new Date(dp.time as string).getTime(), dp.value ?? null] as [number, number | null],
      ),
    };
  }, [eligibilityData?.response?.values]);

  const summaryValue = useMemo(() => {
    if (!series) {
      return null;
    }

    return getSummarizeValueForSingleSeries(series, {
      type: ChartSummaryType.Average,
    });
  }, [series]);

  return useMemo(() => {
    if (isDataLoading || isResponseFailed || isUserForbidden || error) {
      return requestStatus;
    }

    if (!series || summaryValue === null || summaryValue < MINIMUM_PLAYTIME_THRESHOLD) {
      return false;
    }

    return true;
  }, [
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    error,
    series,
    summaryValue,
    requestStatus,
  ]);
};

export default useGetAbuseReportSubmittersEligibility;
