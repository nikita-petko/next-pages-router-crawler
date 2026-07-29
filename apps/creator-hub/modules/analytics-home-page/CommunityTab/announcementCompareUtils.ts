import type { TRAQIV2APIMetric } from '@rbx/creator-hub-analytics-config';
import {
  RAQIV2AnnouncementEventType,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import type { TranslationKeyToFormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnalyticsQueryGatewayClientWrapper } from '@modules/clients/analytics/analyticsQueryGateway';
import type { ChartResource, QueryFilter } from '@modules/clients/analytics/analyticsRAQIShared';
import { MAX_ANNOUNCEMENT_LABEL_LENGTH } from '@modules/experience-analytics-shared/constants/announcementDisplay';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export type MetricTab =
  | 'totalViews'
  | 'uniqueViews'
  | 'totalEngagement'
  | 'uniqueEngagers'
  | 'pushCtr'
  | 'streamCtr';

export type NormalizedDataPoint = [number, number];

const formatDate = (d: Date, locale: string): string =>
  d.toLocaleDateString(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' });

export function formatAnnouncementLabel(
  publishDate: Date,
  lastActiveDate: Date | null,
  title: string,
  translate: TranslationKeyToFormattedText,
  locale: string,
): string {
  const truncatedTitle =
    title.length > MAX_ANNOUNCEMENT_LABEL_LENGTH
      ? `${title.slice(0, MAX_ANNOUNCEMENT_LABEL_LENGTH)}…`
      : title;

  const endDateStr = lastActiveDate ? formatDate(lastActiveDate, locale) : '…';
  return translate(translationKey('Label.AnnouncementDateRange', TranslationNamespace.Community), {
    startDate: formatDate(publishDate, locale),
    endDate: endDateStr,
    title: truncatedTitle,
  });
}

const MS_PER_DAY = 86_400_000;

export function normalizeToActiveDays(
  metricDataPoints: Array<{ time: string; value: number }>,
  activeDayTimes: string[],
  publishDate: Date,
): NormalizedDataPoint[] {
  const activeDayTimestamps = activeDayTimes
    .map((t) => new Date(t).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);

  if (activeDayTimestamps.length === 0) {
    return [];
  }

  const activeDaySet = new Set(activeDayTimestamps);

  const metricByTimestamp = new Map<number, number>();
  for (const point of metricDataPoints) {
    const ts = new Date(point.time).getTime();
    if (!Number.isNaN(ts)) {
      metricByTimestamp.set(ts, point.value);
    }
  }

  const startTs = new Date(publishDate.toISOString().split('T')[0]).getTime();
  const endTs = activeDayTimestamps[activeDayTimestamps.length - 1];

  const result: NormalizedDataPoint[] = [];
  let dayNumber = 1;
  for (let ts = startTs; ts <= endTs; ts += MS_PER_DAY) {
    if (activeDaySet.has(ts)) {
      result.push([dayNumber, metricByTimestamp.get(ts) ?? 0]);
      dayNumber++;
    }
  }

  return result;
}

export async function fetchAnnouncementList(
  client: AnalyticsQueryGatewayClientWrapper,
  resource: ChartResource,
  startDate: Date,
  endDate: Date,
): Promise<Array<{ id: string; publishTimestamp: number }>> {
  const result = await client.query({
    resource,
    metric: RAQIV2Metric.CommunityAnnouncementEventCount,
    granularity: RAQIV2MetricGranularity.None,
    breakdown: [RAQIV2Dimension.AnnouncementId, RAQIV2Dimension.AnnouncementPublishDate],
    filter: [
      {
        dimension: RAQIV2Dimension.AnnouncementEventType,
        values: [RAQIV2AnnouncementEventType.View],
      },
    ],
    startTime: startDate,
    endTime: endDate,
  });

  const announcements: Array<{ id: string; publishTimestamp: number }> = [];
  for (const v of result.values ?? []) {
    const totalValue = v.dataPoints?.[0]?.value;
    if (totalValue == null || totalValue <= 0) {
      continue;
    }
    const id = v.breakdownValue?.find((b) => b.dimension === 'AnnouncementId')?.value;
    const publishDateStr = v.breakdownValue?.find(
      (b) => b.dimension === 'AnnouncementPublishDate',
    )?.value;

    if (!id || !publishDateStr) {
      continue;
    }
    const publishTimestamp = Number(publishDateStr);
    if (Number.isNaN(publishTimestamp)) {
      continue;
    }
    announcements.push({ id, publishTimestamp });
  }

  return announcements.sort((a, b) => b.publishTimestamp - a.publishTimestamp);
}

export async function fetchActiveDays(
  client: AnalyticsQueryGatewayClientWrapper,
  resource: ChartResource,
  announcementId: string,
  startDate: Date,
  endDate: Date,
): Promise<string[]> {
  const result = await fetchActiveDaysBatch(client, resource, [announcementId], startDate, endDate);
  return result.get(announcementId) ?? [];
}

export async function fetchActiveDaysBatch(
  client: AnalyticsQueryGatewayClientWrapper,
  resource: ChartResource,
  announcementIds: string[],
  startDate: Date,
  endDate: Date,
): Promise<Map<string, string[]>> {
  const result = await client.query({
    resource,
    metric: RAQIV2Metric.CommunityAnnouncementEventCount,
    granularity: RAQIV2MetricGranularity.OneDay,
    filter: [
      {
        dimension: RAQIV2Dimension.AnnouncementEventType,
        values: [RAQIV2AnnouncementEventType.View],
      },
      { dimension: RAQIV2Dimension.AnnouncementId, values: announcementIds },
    ],
    breakdown: [RAQIV2Dimension.AnnouncementId],
    startTime: startDate,
    endTime: endDate,
  });

  const activeDaysByAnnouncement = new Map<string, string[]>();
  for (const metricValue of result.values ?? []) {
    const announcementId = metricValue.breakdownValue?.find(
      (bv) => bv.dimension === RAQIV2Dimension.AnnouncementId,
    )?.value;
    if (!announcementId) {
      continue;
    }

    const days: string[] = [];
    for (const dp of metricValue.dataPoints ?? []) {
      if (dp.value != null && dp.value > 0 && dp.time != null) {
        days.push(dp.time);
      }
    }
    activeDaysByAnnouncement.set(announcementId, days.sort());
  }

  return activeDaysByAnnouncement;
}

function snapToUtcDayStart(date: Date): Date {
  const snapped = new Date(date);
  snapped.setUTCHours(0, 0, 0, 0);
  return snapped;
}

type NonCtrMetricTab = 'totalViews' | 'uniqueViews' | 'totalEngagement' | 'uniqueEngagers';

export async function fetchMetricData(
  client: AnalyticsQueryGatewayClientWrapper,
  resource: ChartResource,
  announcementId: string,
  metricTab: NonCtrMetricTab,
  startDate: Date,
  endDate: Date,
): Promise<Array<{ time: string; value: number }>> {
  const queryParams = getMetricQueryParams(metricTab, announcementId);

  const result = await client.query({
    resource,
    metric: queryParams.metric,
    granularity: RAQIV2MetricGranularity.OneDay,
    filter: queryParams.filters,
    startTime: snapToUtcDayStart(startDate),
    endTime: endDate,
  });

  const dataPoints: Array<{ time: string; value: number }> = [];
  const values = result.values?.[0]?.dataPoints;
  if (!values) {
    return dataPoints;
  }

  for (const dp of values) {
    if (dp.time != null && dp.value != null) {
      dataPoints.push({ time: dp.time, value: dp.value });
    }
  }

  return dataPoints;
}

type MetricQueryParams = {
  metric: TRAQIV2APIMetric;
  filters: QueryFilter[];
};

function getMetricQueryParams(
  metricTab: NonCtrMetricTab,
  announcementId: string,
): MetricQueryParams {
  const announcementFilter: QueryFilter = {
    dimension: RAQIV2Dimension.AnnouncementId,
    values: [announcementId],
  };

  switch (metricTab) {
    case 'totalViews':
      return {
        metric: RAQIV2Metric.CommunityAnnouncementEventCount,
        filters: [
          {
            dimension: RAQIV2Dimension.AnnouncementEventType,
            values: [RAQIV2AnnouncementEventType.View],
          },
          announcementFilter,
        ],
      };
    case 'uniqueViews':
      return {
        metric: RAQIV2Metric.CommunityAnnouncementUniqueUsers,
        filters: [
          {
            dimension: RAQIV2Dimension.AnnouncementEventType,
            values: [RAQIV2AnnouncementEventType.View],
          },
          announcementFilter,
        ],
      };
    case 'totalEngagement':
      return {
        metric: RAQIV2Metric.CommunityAnnouncementEventCount,
        filters: [
          {
            dimension: RAQIV2Dimension.AnnouncementEventType,
            values: [RAQIV2AnnouncementEventType.NetReaction, RAQIV2AnnouncementEventType.PollVote],
          },
          announcementFilter,
        ],
      };
    case 'uniqueEngagers':
      return {
        metric: RAQIV2Metric.CommunityAnnouncementUniqueUsers,
        filters: [
          {
            dimension: RAQIV2Dimension.AnnouncementEventType,
            values: [RAQIV2AnnouncementEventType.NetReaction, RAQIV2AnnouncementEventType.PollVote],
          },
          announcementFilter,
        ],
      };
    default: {
      const exhaustiveCheck: never = metricTab;
      return exhaustiveCheck;
    }
  }
}
