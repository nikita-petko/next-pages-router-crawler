import { useCallback, useMemo } from 'react';
import { subDays } from '@rbx/core';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { getCurrentDate } from '@modules/charts-generic/utils/dateUtils';
import type {
  RAQIV2BreakdownValue,
  RAQIV2DataPoint,
  RAQIV2QueryResult,
} from '@modules/clients/analytics';
import { useExperienceAnalyticsGameDetails } from '@modules/experience-analytics-shared/context/ExperienceAnalyticsGameDetailsProvider';
import { useRAQIV2Client } from '@modules/experience-analytics-shared/context/RAQIV2ClientProvider';
import useApiRequest from '@modules/experience-analytics-shared/hooks/useApiRequest';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import makeRAQIV2Request from '@modules/experience-analytics-shared/utils/makeRAQIV2Request';
import {
  snapToLatestEndTime,
  snapToLatestStartTime,
} from '@modules/experience-analytics-shared/utils/snapToLatestTimestep';

export type NewestLivePlaceVersion = {
  placeId: number;
  placeName: string;
  version: number;
};

type LivePlaceVersionCandidate = NewestLivePlaceVersion & {
  observedAt: number;
};

const getBreakdownValue = (
  breakdownValues: RAQIV2BreakdownValue[] | null | undefined,
  dimension: RAQIV2Dimension,
): RAQIV2BreakdownValue | undefined =>
  breakdownValues?.find((breakdownValue) => breakdownValue.dimension === dimension);

const getLatestObservedTime = (dataPoints: RAQIV2DataPoint[] | null | undefined): number | null =>
  dataPoints?.reduce<number | null>((latestObservedAt, dataPoint) => {
    const { time, value } = dataPoint;
    if (time === undefined || value === undefined || value <= 0) {
      return latestObservedAt;
    }

    const observedAt = new Date(time).getTime();
    if (Number.isNaN(observedAt)) {
      return latestObservedAt;
    }

    if (latestObservedAt === null || observedAt > latestObservedAt) {
      return observedAt;
    }
    return latestObservedAt;
  }, null) ?? null;

const getNewestVersionsByPlace = (
  response: RAQIV2QueryResult | null | undefined,
): Map<number, LivePlaceVersionCandidate> => {
  const newestByPlace = new Map<number, LivePlaceVersionCandidate>();

  response?.values?.forEach((metricValue) => {
    const place = getBreakdownValue(metricValue.breakdownValue, RAQIV2Dimension.Place);
    const placeVersion = getBreakdownValue(
      metricValue.breakdownValue,
      RAQIV2Dimension.PlaceVersion,
    );
    const placeId = Number(place?.value);
    const version = Number(placeVersion?.value);
    const observedAt = getLatestObservedTime(metricValue.dataPoints);

    if (Number.isNaN(placeId) || Number.isNaN(version) || observedAt === null) {
      return;
    }

    const currentNewest = newestByPlace.get(placeId);
    if (currentNewest && currentNewest.version >= version) {
      return;
    }

    newestByPlace.set(placeId, {
      placeId,
      placeName: place?.displayValue ?? `${placeId}`,
      version,
      observedAt,
    });
  });

  return newestByPlace;
};

const useNewestLivePlaceVersion = (enabled = true): NewestLivePlaceVersion | null => {
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

  const makeRequest = useCallback(async () => {
    if (!enabled || !resource || rootPlaceId <= 0) {
      return null;
    }

    const previousStartTime = snapToLatestStartTime(twoDaysAgo, RAQIV2MetricGranularity.OneMinute);
    const previousEndTime = snapToLatestEndTime(oneDayAgo, RAQIV2MetricGranularity.OneMinute);
    const currentStartTime = snapToLatestStartTime(oneDayAgo, RAQIV2MetricGranularity.OneMinute);
    const currentEndTime = snapToLatestEndTime(current, RAQIV2MetricGranularity.OneMinute);

    const [previousVersions, currentVersions] = await Promise.all(
      [
        { startTime: previousStartTime, endTime: previousEndTime },
        { startTime: currentStartTime, endTime: currentEndTime },
      ].map(({ startTime, endTime }) =>
        makeRAQIV2Request(
          {
            metric: RAQIV2Metric.PeakConcurrentPlayers,
            breakdown: [RAQIV2Dimension.Place, RAQIV2Dimension.PlaceVersion],
            timeSpec: {
              rangeType: RAQIV2DateRangeType.Custom,
              startTime,
              endTime,
            },
            granularity: RAQIV2MetricGranularity.OneMinute,
            resource,
          },
          client,
        ),
      ),
    );
    const previousNewestVersionsByPlace = getNewestVersionsByPlace(previousVersions.response);
    const currentNewestVersionsByPlace = getNewestVersionsByPlace(currentVersions.response);

    return Array.from(
      currentNewestVersionsByPlace.values(),
    ).reduce<LivePlaceVersionCandidate | null>((currentNewest, candidate) => {
      const previousNewestVersion = previousNewestVersionsByPlace.get(candidate.placeId)?.version;
      if (candidate.version === previousNewestVersion) {
        return currentNewest;
      }
      if (
        !currentNewest ||
        candidate.observedAt > currentNewest.observedAt ||
        (candidate.observedAt === currentNewest.observedAt &&
          candidate.version > currentNewest.version)
      ) {
        return candidate;
      }
      return currentNewest;
    }, null);
  }, [client, current, enabled, oneDayAgo, resource, rootPlaceId, twoDaysAgo]);

  const { data, isDataLoading } = useApiRequest(makeRequest);

  return useMemo(() => {
    if (!isDataLoading) {
      return data;
    }
    return null;
  }, [data, isDataLoading]);
};

export default useNewestLivePlaceVersion;
