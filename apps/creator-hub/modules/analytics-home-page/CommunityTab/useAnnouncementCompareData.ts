import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import type { ChartResource } from '@modules/clients/analytics/analyticsRAQIShared';
import { ANNOUNCEMENT_ANALYTICS_START_DATE } from '@modules/experience-analytics-shared/constants/announcementDisplay';
import type { RAQIV2CombinedAPIClientWrapper } from '@modules/experience-analytics-shared/utils/makeRAQIV2Request';
import makeRAQIV2Request from '@modules/experience-analytics-shared/utils/makeRAQIV2Request';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import type { MetricTab, NormalizedDataPoint } from './announcementCompareUtils';
import {
  fetchActiveDays,
  fetchActiveDaysBatch,
  fetchAnnouncementList,
  fetchMetricData,
  normalizeToActiveDays,
} from './announcementCompareUtils';

const EMPTY_SERIES: CompareSeriesData[] = [];

export type AnnouncementOptionRaw = {
  id: string;
  publishDate: Date;
  lastActiveDate: Date | null;
};

export type CompareSeriesData = {
  announcementId: string;
  dataPoints: NormalizedDataPoint[];
};

export type AnnouncementCompareResult = {
  announcementOptionIds: AnnouncementOptionRaw[];
  isLoadingOptions: boolean;
  optionsError: boolean;
  seriesData: CompareSeriesData[];
  isLoadingSeries: boolean;
  seriesError: boolean;
  maxDayCount: number;
  effectiveSelectedIds: Array<string | null>;
};

function snapToUtcDayStart(date: Date): Date {
  const snapped = new Date(date);
  snapped.setUTCHours(0, 0, 0, 0);
  return snapped;
}

async function fetchCtrData(
  client: RAQIV2CombinedAPIClientWrapper,
  resource: ChartResource,
  announcementId: string,
  channel: 'Push' | 'Stream',
  startDate: Date,
  endDate: Date,
): Promise<Array<{ time: string; value: number }>> {
  const ctrResult = await makeRAQIV2Request(
    {
      resource,
      metric: RAQIV2Metric.CommunityAnnouncementNotificationCTR,
      granularity: RAQIV2MetricGranularity.OneDay,
      filter: [
        { dimension: RAQIV2Dimension.NotificationChannel, values: [channel] },
        { dimension: RAQIV2Dimension.AnnouncementId, values: [announcementId] },
      ],
      timeSpec: {
        rangeType: RAQIV2DateRangeType.Custom,
        startTime: snapToUtcDayStart(startDate),
        endTime: endDate,
      },
    },
    client,
    { fillMissingDatapoints: true },
  );

  const dataPoints: Array<{ time: string; value: number }> = [];
  const responseValues = ctrResult.response?.values;
  if (!responseValues || responseValues.length === 0) {
    return dataPoints;
  }

  const firstValue = responseValues[0];
  const rawPoints = firstValue.dataPoints;
  if (!rawPoints) {
    return dataPoints;
  }

  // CTR is cumulative — once it goes above zero it can't regress, so carry
  // forward the last non-zero value over any zero-filled gaps inserted by
  // makeRAQIV2Request's fillMissingDataPoints. Initial zeros are kept as-is
  // (legitimate 0% CTR before any clicks).
  let lastNonZero = 0;
  for (const dp of rawPoints) {
    if (dp.time == null || dp.value == null) {
      continue;
    }
    if (dp.value > 0) {
      lastNonZero = dp.value;
      dataPoints.push({ time: dp.time, value: dp.value });
    } else if (lastNonZero > 0) {
      dataPoints.push({ time: dp.time, value: lastNonZero });
    } else {
      dataPoints.push({ time: dp.time, value: 0 });
    }
  }

  return dataPoints;
}

export function useAnnouncementCompareData(
  resource: ChartResource,
  client: RAQIV2CombinedAPIClientWrapper,
  userSelectedIds: Array<string | null>,
  activeTab: MetricTab,
  addAnnouncementIds: (ids: string[]) => void,
  resetSelection: () => void,
): AnnouncementCompareResult {
  const currentGroup = useCurrentGroup();
  const groupId = currentGroup?.id ?? null;
  const [announcementOptionIds, setAnnouncementOptionIds] = useState<AnnouncementOptionRaw[]>([]);
  const [optionsLoadedForGroupId, setOptionsLoadedForGroupId] = useState<number | null>(null);
  const [optionsError, setOptionsError] = useState(false);
  const [seriesData, setSeriesData] = useState<CompareSeriesData[]>([]);
  const [seriesError, setSeriesError] = useState(false);
  const [maxDayCount, setMaxDayCount] = useState(0);
  const [completedFetchKey, setCompletedFetchKey] = useState('');
  const [prevGroupId, setPrevGroupId] = useState(groupId);

  const activeDaysCacheRef = useRef<Map<string, string[]>>(new Map());
  const endDate = useMemo(() => new Date(), []);

  if (prevGroupId !== groupId) {
    setPrevGroupId(groupId);
    setAnnouncementOptionIds([]);
    setOptionsError(false);
    setSeriesData([]);
    setSeriesError(false);
    setMaxDayCount(0);
    setCompletedFetchKey('');
    resetSelection();
  }

  const isLoadingOptions = groupId !== optionsLoadedForGroupId;

  const effectiveSelectedIds = useMemo((): Array<string | null> => {
    if (userSelectedIds.some(Boolean)) {
      return userSelectedIds;
    }
    if (announcementOptionIds.length >= 2) {
      return [announcementOptionIds[0].id, announcementOptionIds[1].id];
    }
    if (announcementOptionIds.length === 1) {
      return [announcementOptionIds[0].id, null];
    }
    return userSelectedIds;
  }, [userSelectedIds, announcementOptionIds]);

  const currentFetchKey = useMemo(
    () => JSON.stringify({ ids: effectiveSelectedIds.filter(Boolean), activeTab }),
    [effectiveSelectedIds, activeTab],
  );
  const isLoadingSeries = completedFetchKey !== currentFetchKey;

  const fetchOptions = useCallback(async (): Promise<AnnouncementOptionRaw[]> => {
    const rawAnnouncements = await fetchAnnouncementList(
      client.platformGatewayRAQIClient,
      resource,
      ANNOUNCEMENT_ANALYTICS_START_DATE,
      endDate,
    );

    const ids = rawAnnouncements.map((a) => a.id);
    const activeDaysMap = await fetchActiveDaysBatch(
      client.platformGatewayRAQIClient,
      resource,
      ids,
      ANNOUNCEMENT_ANALYTICS_START_DATE,
      endDate,
    );

    for (const [id, days] of activeDaysMap) {
      activeDaysCacheRef.current.set(id, days);
    }

    return rawAnnouncements
      .filter((a) => {
        if (a.publishTimestamp < ANNOUNCEMENT_ANALYTICS_START_DATE.getTime()) {
          return false;
        }
        const days = activeDaysMap.get(a.id);
        return days != null && days.length > 0;
      })
      .map((a) => {
        const days = activeDaysMap.get(a.id) ?? [];
        const publishDate = new Date(a.publishTimestamp);
        const lastActiveDate = days.length > 0 ? new Date(days[days.length - 1]) : null;
        return { id: a.id, publishDate, lastActiveDate };
      });
  }, [client, resource, endDate]);

  useEffect(() => {
    if (!groupId) {
      return undefined;
    }

    let cancelled = false;

    void fetchOptions()
      .then((options) => {
        if (cancelled) {
          return;
        }
        setAnnouncementOptionIds(options);
        setOptionsError(false);
        setOptionsLoadedForGroupId(groupId);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setAnnouncementOptionIds([]);
        setOptionsError(true);
        setOptionsLoadedForGroupId(groupId);
      });

    return () => {
      cancelled = true;
    };
  }, [groupId, fetchOptions]);

  const announcementOptionIdStrings = useMemo(
    () => announcementOptionIds.map((o) => o.id),
    [announcementOptionIds],
  );

  useEffect(() => {
    if (announcementOptionIdStrings.length > 0) {
      addAnnouncementIds(announcementOptionIdStrings);
    }
  }, [addAnnouncementIds, announcementOptionIdStrings]);

  useEffect(() => {
    const validIds = effectiveSelectedIds.filter((id): id is string => id != null);
    if (validIds.length === 0 || announcementOptionIds.length === 0) {
      return undefined;
    }

    let cancelled = false;

    const fetchSeries = async (): Promise<{
      results: CompareSeriesData[];
      maxDays: number;
    }> => {
      const seriesPromises = validIds.map(async (announcementId) => {
        const option = announcementOptionIds.find((o) => o.id === announcementId);
        if (!option) {
          return null;
        }

        const fetchMetric = (): Promise<Array<{ time: string; value: number }>> => {
          if (activeTab === 'pushCtr') {
            return fetchCtrData(
              client,
              resource,
              announcementId,
              'Push',
              option.publishDate,
              endDate,
            );
          } else if (activeTab === 'streamCtr') {
            return fetchCtrData(
              client,
              resource,
              announcementId,
              'Stream',
              option.publishDate,
              endDate,
            );
          }
          return fetchMetricData(
            client.platformGatewayRAQIClient,
            resource,
            announcementId,
            activeTab,
            option.publishDate,
            endDate,
          );
        };

        const cachedDays = activeDaysCacheRef.current.get(announcementId);
        const [activeDays, metricData] = await Promise.all([
          cachedDays
            ? Promise.resolve(cachedDays)
            : fetchActiveDays(
                client.platformGatewayRAQIClient,
                resource,
                announcementId,
                option.publishDate,
                endDate,
              ),
          fetchMetric(),
        ]);

        if (!cachedDays) {
          activeDaysCacheRef.current.set(announcementId, activeDays);
        }

        if (activeDays.length === 0) {
          return null;
        }

        const isCtrTab = activeTab === 'pushCtr' || activeTab === 'streamCtr';
        if (isCtrTab && metricData.length === 0) {
          return null;
        }

        const normalized = normalizeToActiveDays(metricData, activeDays, option.publishDate);
        return { announcementId, dataPoints: normalized };
      });

      const settled = await Promise.all(seriesPromises);
      const results = settled.filter((r): r is CompareSeriesData => r != null);
      const maxDays = results.reduce((max, r) => Math.max(max, r.dataPoints.length), 0);

      return { results, maxDays };
    };

    void fetchSeries()
      .then(({ results, maxDays }) => {
        if (cancelled) {
          return;
        }
        setSeriesData(results);
        setSeriesError(false);
        setMaxDayCount(maxDays);
        setCompletedFetchKey(currentFetchKey);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setSeriesData([]);
        setSeriesError(true);
        setMaxDayCount(0);
        setCompletedFetchKey(currentFetchKey);
      });

    return () => {
      cancelled = true;
    };
  }, [
    effectiveSelectedIds,
    activeTab,
    announcementOptionIds,
    client,
    resource,
    endDate,
    currentFetchKey,
  ]);

  const hasValidSelection = effectiveSelectedIds.some((id) => id != null);

  return {
    announcementOptionIds,
    isLoadingOptions,
    optionsError,
    seriesData: hasValidSelection ? seriesData : EMPTY_SERIES,
    isLoadingSeries: hasValidSelection ? isLoadingSeries : false,
    seriesError: hasValidSelection ? seriesError : false,
    maxDayCount: hasValidSelection ? maxDayCount : 0,
    effectiveSelectedIds,
  };
}
