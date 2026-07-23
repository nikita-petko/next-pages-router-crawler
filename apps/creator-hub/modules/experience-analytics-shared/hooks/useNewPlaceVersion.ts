import { useCallback, useMemo } from 'react';
import { subDays } from '@rbx/core';
import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { getCurrentDate } from '@modules/charts-generic/utils/dateUtils';
import type {
  RAQIV2GetDimensionValuesRequest,
  RAQIV2DimensionValuesResult,
} from '@modules/clients/analytics';
import { useExperienceAnalyticsGameDetails } from '../context/ExperienceAnalyticsGameDetailsProvider';
import { useRAQIV2Client } from '../context/RAQIV2ClientProvider';
import { makeDimensionValuesQuery } from '../utils/makeRAQIV2Request';
import { snapToLatestEndTime, snapToLatestStartTime } from '../utils/snapToLatestTimestep';
import useApiRequest from './useApiRequest';
import { useUniverseResource } from './useChartResourceProvider';

const getNewestVersionFromResponse = (
  response: RAQIV2DimensionValuesResult | null | undefined,
): number | null => {
  if (!response || !response.values || response.values.length === 0) {
    return null;
  }
  const dimensionValues = response.values.find(
    (v) => v.dimension && v.dimension.name && v.dimension.name === RAQIV2Dimension.PlaceVersion,
  )?.values;
  return (
    dimensionValues?.reduce<number | null>((currentMax, metricValue) => {
      const versionNumber = Number(metricValue.value);
      if (Number.isNaN(versionNumber)) {
        return currentMax;
      }
      if (currentMax === null || versionNumber > currentMax) {
        return versionNumber;
      }
      return currentMax;
    }, null) ?? null
  );
};

const getNewestVersionAdapter = (responses: RAQIV2DimensionValuesResult[]) => {
  const previousNewestVersion = getNewestVersionFromResponse(responses[0]);
  const currentNewestVersion = getNewestVersionFromResponse(responses[1]);
  if (!currentNewestVersion || currentNewestVersion === previousNewestVersion) {
    return null;
  }
  return currentNewestVersion;
};

const useNewPlaceVersion = () => {
  const resource = useUniverseResource();
  const { rootPlaceId } = useExperienceAnalyticsGameDetails();
  const { client } = useRAQIV2Client(true);

  const { twoDaysAgo, oneDayAgo, current } = useMemo(() => {
    const currentTime = getCurrentDate();
    return {
      twoDaysAgo: subDays(currentTime, 2),
      oneDayAgo: subDays(currentTime, 1),
      current: currentTime,
    };
  }, []);

  const queryRequests: RAQIV2GetDimensionValuesRequest[] = useMemo(() => {
    if (!resource || rootPlaceId <= 0) {
      return [];
    }
    const baseRequest = {
      resource,
      metrics: [RAQIV2Metric.PeakConcurrentPlayers],
      dimension: RAQIV2Dimension.PlaceVersion,
      filter: [{ dimension: RAQIV2Dimension.Place, values: [`${rootPlaceId}`] }],
    };
    return [
      {
        ...baseRequest,
        startTime: snapToLatestStartTime(twoDaysAgo, RAQIV2MetricGranularity.OneMinute),
        endTime: snapToLatestEndTime(oneDayAgo, RAQIV2MetricGranularity.OneMinute),
      },
      {
        ...baseRequest,
        startTime: snapToLatestStartTime(oneDayAgo, RAQIV2MetricGranularity.OneMinute),
        endTime: snapToLatestEndTime(current, RAQIV2MetricGranularity.OneMinute),
      },
    ];
  }, [resource, rootPlaceId, twoDaysAgo, oneDayAgo, current]);

  const makeRequest = useCallback(async () => {
    if (queryRequests.length === 0) {
      return null;
    }
    return Promise.all(queryRequests.map((req) => makeDimensionValuesQuery(client, req)));
  }, [client, queryRequests]);

  const { data, isDataLoading } = useApiRequest(makeRequest);

  return useMemo(() => {
    if (data && !isDataLoading) {
      return getNewestVersionAdapter(data);
    }
    return null;
  }, [data, isDataLoading]);
};

export default useNewPlaceVersion;
