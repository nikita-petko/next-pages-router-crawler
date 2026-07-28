import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { SelectionCallback } from '@rbx/analytics-ui';
import {
  RAQIV2AnnouncementEventType,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import FilterStringChoice from '@modules/charts-generic/components/FilterStringChoice';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import AnalyticsConfigChart from '@modules/experience-analytics-shared/components/RAQIV2/AnalyticsConfigChart';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import { useRAQIV2Client } from '@modules/experience-analytics-shared/context/RAQIV2ClientProvider';
import { RAQIV2SummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type { ChartConfig } from '@modules/experience-analytics-shared/types/RAQIV2ChartConfig';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import type { RAQIV2CombinedAPIClientWrapper } from '@modules/experience-analytics-shared/utils/makeRAQIV2Request';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type NotificationChannel = 'push' | 'stream';

const NOTIFICATION_CHANNEL_OPTIONS: NotificationChannel[] = ['push', 'stream'];

const CHANNEL_LABEL_KEYS: Record<NotificationChannel, string> = {
  push: 'Label.PushNotifications',
  stream: 'Label.StreamNotifications',
};

const CHANNEL_TO_FILTER_VALUE: Record<NotificationChannel, string> = {
  push: 'Push',
  stream: 'Stream',
};

function buildChartConfig(channel: NotificationChannel, announcementIds: string[]): ChartConfig {
  const channelValue = CHANNEL_TO_FILTER_VALUE[channel];
  const filter: Array<{ dimension: RAQIV2Dimension; values: string[] }> = [
    { dimension: RAQIV2Dimension.NotificationChannel, values: [channelValue] },
    {
      dimension: RAQIV2Dimension.AnnouncementId,
      values: announcementIds.length > 0 ? announcementIds : ['__none__'],
    },
  ];

  return {
    type: AnalyticsComponentType.Chart,
    chartKey: 'announcement-notification-ctr',
    titleKey: translationKey(
      'Label.Metric.CommunityAnnouncementNotificationCtr',
      TranslationNamespace.Community,
    ),
    definitionTooltipKey: translationKey(
      'Description.CommunityAnnouncementNotificationCtr',
      TranslationNamespace.Analytics,
    ),
    metric: RAQIV2Metric.CommunityAnnouncementNotificationCTR,
    overrides: {
      breakdown: { intersect: [RAQIV2Dimension.AnnouncementId] },
      filter: { intersect: filter },
    },
    chartType: ChartType.Spline,
    hideTotalSeriesInChart: true,
    summarySpec: {
      totalSummaryTypes: [],
      perBreakdownSummaryTypes: [{ type: RAQIV2SummaryType.LastValue }],
      aggregatedBreakdownSummaryTypes: [],
    },
  };
}

function useActiveAnnouncementIds({
  channel,
  chartContext,
  client,
  startDate,
  endDate,
}: {
  channel: NotificationChannel;
  chartContext: RAQIV2ChartContext;
  client: RAQIV2CombinedAPIClientWrapper;
  startDate: Date;
  endDate: Date;
}): { ids: string[] | null; resolvedChannel: NotificationChannel; isError: boolean } {
  const [result, setResult] = useState<{
    ids: string[] | null;
    resolvedChannel: NotificationChannel;
    isError: boolean;
  }>({ ids: null, resolvedChannel: channel, isError: false });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const clickEventType =
          channel === 'push'
            ? RAQIV2AnnouncementEventType.PushClicked
            : RAQIV2AnnouncementEventType.StreamClicked;
        const clicksResult = await client.platformGatewayRAQIClient.query({
          resource: chartContext.resource,
          metric: RAQIV2Metric.CommunityAnnouncementEventCount,
          granularity: RAQIV2MetricGranularity.None,
          breakdown: [RAQIV2Dimension.AnnouncementId],
          filter: [
            {
              dimension: RAQIV2Dimension.AnnouncementEventType,
              values: [clickEventType],
            },
          ],
          startTime: startDate,
          endTime: endDate,
        });

        if (cancelled) {
          return;
        }

        const ids =
          clicksResult.values
            ?.filter((v) => {
              const value = v.dataPoints?.[0]?.value;
              return value != null && value > 0;
            })
            .map((v) => v.breakdownValue?.find((b) => b.dimension === 'AnnouncementId')?.value)
            .filter((id): id is string => id != null) ?? [];

        setResult({ ids, resolvedChannel: channel, isError: false });
      } catch {
        if (!cancelled) {
          setResult({ ids: null, resolvedChannel: channel, isError: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [channel, startDate, endDate, client, chartContext.resource]);

  return result;
}

function hasPlatformDimension(chartContext: RAQIV2ChartContext): boolean {
  if (chartContext.breakdown?.includes(RAQIV2Dimension.Platform)) {
    return true;
  }
  return chartContext.filter?.some((f) => f.dimension === RAQIV2Dimension.Platform) ?? false;
}

const AnnouncementNotificationCtrInner: React.FC<{
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion: SelectionCallback<number> | null;
}> = ({ chartContext, onSelectChartRegion }) => {
  const { startDate, endDate } = useAnalyticsCurrentDateRangeBundle();
  const { translate } = useRAQIV2TranslationDependencies();
  const { client } = useRAQIV2Client(false);
  const [channel, setChannel] = useState<NotificationChannel>('push');

  const { resolvedChannel, ids, isError } = useActiveAnnouncementIds({
    channel,
    chartContext,
    client,
    startDate,
    endDate,
  });

  const chartConfig = useMemo(
    () => buildChartConfig(resolvedChannel, isError ? [] : (ids ?? [])),
    [resolvedChannel, isError, ids],
  );

  const formatChannelOption = useCallback(
    (option: NotificationChannel) =>
      translate(translationKey(CHANNEL_LABEL_KEYS[option], TranslationNamespace.Community)),
    [translate],
  );

  const handleChannelChange = useCallback((next: NotificationChannel[]) => {
    if (next.length > 0) {
      setChannel(next[0]);
    }
  }, []);

  const chartControl = useMemo(
    () => (
      <div className='padding-top-small'>
        <FilterStringChoice
          className='min-width-[150px]'
          selectedOptions={[channel]}
          options={NOTIFICATION_CHANNEL_OPTIONS}
          formatOption={formatChannelOption}
          onChange={handleChannelChange}
        />
      </div>
    ),
    [channel, formatChannelOption, handleChannelChange],
  );

  const isPlatformActive = hasPlatformDimension(chartContext);

  const effectiveChartContext = useMemo(() => {
    if (!isPlatformActive) {
      return chartContext;
    }
    return {
      ...chartContext,
      breakdown: chartContext.breakdown?.filter((d) => d !== RAQIV2Dimension.Platform),
      filter: chartContext.filter?.filter((f) => f.dimension !== RAQIV2Dimension.Platform),
    };
  }, [chartContext, isPlatformActive]);

  const effectiveConfig = useMemo(
    () => (isPlatformActive ? buildChartConfig(resolvedChannel, []) : chartConfig),
    [isPlatformActive, resolvedChannel, chartConfig],
  );

  return (
    <AnalyticsConfigChart
      chartKeyOrConfig={effectiveConfig}
      chartContext={effectiveChartContext}
      onSelectChartRegion={onSelectChartRegion}
      chartControl={chartControl}
    />
  );
};

export function getAnnouncementNotificationCtrConfig(): ArbitraryComponentConfig {
  return {
    type: AnalyticsComponentType.NonGeneric,
    metrics: [RAQIV2Metric.CommunityAnnouncementNotificationCTR],
    renderer: {
      type: 'withChartContext',
      render: (chartContext, onSelectChartRegion) => (
        <AnnouncementNotificationCtrInner
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
        />
      ),
    },
  };
}
