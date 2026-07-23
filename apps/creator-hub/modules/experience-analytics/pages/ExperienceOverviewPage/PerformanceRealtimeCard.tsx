import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { dateTimeFormatter, subDays } from '@rbx/core';
import {
  RAQIV2DateRangeType,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { useFlag } from '@rbx/flags';
import { Button } from '@rbx/foundation-ui';
import {
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  Grid,
  Skeleton,
  Typography,
} from '@rbx/ui';
import { isExperienceAlertsEnabled } from '@generated/flags/creatorAnalytics';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { NumberContext } from '@modules/charts-generic/charts/numberFormatters';
import { noDataSymbol } from '@modules/charts-generic/components/MetricValue/MetricValue';
import { analyticsPerformanceNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import dateRangeOffsetDays from '@modules/charts-generic/constants/dateRangeOffsetDays';
import useLocale from '@modules/charts-generic/context/useLocale';
import buildExperienceAnalyticsUrlWithParams from '@modules/charts-generic/utils/analyticsUrlBuilder';
import {
  getCurrentDate,
  hourInMilliseconds,
  subMinutes,
} from '@modules/charts-generic/utils/dateUtils';
import AnalyticsConfigChart from '@modules/experience-analytics-shared/components/RAQIV2/AnalyticsConfigChart';
import RAQIV2PredefinedSummaryComparisonChip from '@modules/experience-analytics-shared/components/RAQIV2/summaryItem/GenericRAQIV2MetricSummaryComparisonChip';
import RAQIV2PredefinedSummaryItem from '@modules/experience-analytics-shared/components/RAQIV2/summaryItem/RAQIV2PredefinedSummaryItem';
import RAQIV2PredefinedChartKey from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartKey';
import RAQIV2PredefinedSummaryItemConfig, {
  RAQIV2PredefinedSummaryItemKey,
} from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedSummaryItemConfig';
import { useUniversePerformanceRaqiClientProvider } from '@modules/experience-analytics-shared/context/UniversePerformanceRaqiClientProvider';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useLiveConcurrentPlayerStats from '@modules/experience-analytics-shared/hooks/useLiveConcurrentPlayerStats';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { ChartLoggingContext } from '@modules/experience-analytics-shared/types/ChartEventLogger';
import type { TChartEventLogging } from '@modules/experience-analytics-shared/types/ChartEventLogger';
import formatAnalyticsNumber from '@modules/experience-analytics-shared/utils/analyticsNumberFormatter';
import { Link } from '@modules/miscellaneous/components';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import Section from '../../components/Section';
import { logClickRealtimeSeeMore } from './logger';
import NewPlaceVersionLiveAlert from './NewPlaceVersionLiveAlert';
import usePerformanceRealtimeCardStyles from './PerformanceRealtimeCard.styles';

const chartEventLogging: TChartEventLogging = {
  eventNames: {
    chartImpression: 'analytics/overview/chartImpression',
    hoverImpression: 'analytics/overview/chartHoverImpression',
  },
  context: ChartLoggingContext.RealtimeCard,
};

const summaryItemKeys = [
  RAQIV2PredefinedSummaryItemKey.PerformanceSessionTime,
  RAQIV2PredefinedSummaryItemKey.PerformanceClientCrashRate,
  RAQIV2PredefinedSummaryItemKey.PerformanceClientFps,
  RAQIV2PredefinedSummaryItemKey.PerformanceServerMemoryUsage,
] as const;

// The current minute's metrics aren't ingested yet, so query slightly in the
// past to avoid empty datapoints in the realtime summary items.
const METRIC_STATS_OFFSET_MINUTES = 2;

export const getHourlyComparisonTimestamp = (time: Date): number =>
  Math.floor(time.getTime() / hourInMilliseconds) * hourInMilliseconds;

const PerformanceRealtimeCard: FC = () => {
  const {
    classes: {
      card,
      cardHeader,
      cardContent,
      cardActions,
      miniChartContainer,
      summaryItemsContainer,
    },
  } = usePerformanceRealtimeCardStyles();
  const { id: universeId } = useUniverseResource();
  const { universePerformanceRaqiClient } = useUniversePerformanceRaqiClientProvider();

  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate } = translationDependencies;
  const locale = useLocale();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  // When the Experience Alerts flag is on, the new-place-version banner is
  // owned by the Alerts card above this one; suppress it here to avoid
  // rendering the same banner twice.
  const { value: isExperienceAlertsEnabledFlag } = useFlag(isExperienceAlertsEnabled, {
    universeId,
  });
  const showLegacyNewPlaceVersionBanner = !isExperienceAlertsEnabledFlag;

  // event loggers
  const onClickSeeMore = useCallback(() => {
    logClickRealtimeSeeMore(unifiedLogger, universeId);
  }, [unifiedLogger, universeId]);
  const summaryItemEventLogging = useMemo(
    () => ({
      eventNames: {
        hoverComparison: 'analytics/overview/hoverRealtimeComparisonChip',
      },
    }),
    [],
  );

  const { summary, isLoading, latestUpdateTime } = useLiveConcurrentPlayerStats(
    universeId,
    universePerformanceRaqiClient,
  );

  // Use the successful live poll as the clock so realtime metric queries advance even when
  // TanStack Query structurally shares an unchanged summary object between polls.
  const currentTime = useMemo(() => latestUpdateTime ?? getCurrentDate(), [latestUpdateTime]);

  // The chart and comparison chips summarize seven days at one-hour granularity. Keep their
  // context stable within an hour so they refetch hourly, independently of the minute-level values.
  const currentHourTimestamp = getHourlyComparisonTimestamp(currentTime);
  const currentHour = useMemo(() => new Date(currentHourTimestamp), [currentHourTimestamp]);

  const resource = useUniverseResource();
  // Display last 7 days of data for mini CCU chart
  const chartContext = useMemo(() => {
    return {
      resource,
      timeSpec: {
        rangeType: RAQIV2DateRangeType.Custom,
        startTime: subDays(currentHour, dateRangeOffsetDays[RAQIV2DateRangeType.Last7Days]),
        endTime: currentHour,
      },
      granularity: RAQIV2MetricGranularity.OneHour,
      // Summary cards don't have time axes
      timeAxisBounds: null,
    };
  }, [currentHour, resource]);

  const formattedTime = useMemo(
    () =>
      latestUpdateTime ? (
        dateTimeFormatter(locale).getCustomDateTime(latestUpdateTime, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      ) : (
        <Skeleton animate width={32} />
      ),
    [latestUpdateTime, locale],
  );

  const title = useMemo(() => {
    const formattedNumber =
      summary?.total !== undefined
        ? formatAnalyticsNumber(
            summary.total,
            {
              metric: RAQIV2Metric.PeakConcurrentPlayers,
              context: NumberContext.DataPoint,
            },
            translationDependencies,
          )
        : noDataSymbol;

    const labelKey =
      RAQIV2PredefinedSummaryItemConfig[
        RAQIV2PredefinedSummaryItemKey.PerformancePeakConcurrentPlayers
      ].labelKey;

    return (
      <Container disableGutters>
        {showLegacyNewPlaceVersionBanner ? <NewPlaceVersionLiveAlert /> : null}
        <Typography variant='smallLabel2' color='secondary'>
          {labelKey ? translate(labelKey) : ''}
        </Typography>
        <Grid container item justifyContent='space-between' alignItems='center'>
          <Typography variant='h5'>
            {isLoading ? <Skeleton animate width={64} /> : formattedNumber}
          </Typography>
          <RAQIV2PredefinedSummaryComparisonChip
            predefinedKey={RAQIV2PredefinedSummaryItemKey.PerformancePeakConcurrentPlayers}
            chartContext={chartContext}
            eventLogging={summaryItemEventLogging}
          />
        </Grid>
      </Container>
    );
  }, [
    chartContext,
    isLoading,
    showLegacyNewPlaceVersionBanner,
    summary,
    summaryItemEventLogging,
    translate,
    translationDependencies,
  ]);

  const metricStatsContext = useMemo(() => {
    const metricStatsTime = subMinutes(currentTime, METRIC_STATS_OFFSET_MINUTES);
    return {
      resource,
      timeSpec: {
        rangeType: RAQIV2DateRangeType.Custom,
        startTime: metricStatsTime,
        endTime: metricStatsTime,
      },
      granularity: RAQIV2MetricGranularity.OneMinute,
      timeAxisBounds: null,
    };
  }, [currentTime, resource]);

  return (
    <Section
      title={translate(translationKey('Title.Realtime', TranslationNamespace.Insights))}
      action={
        <Typography variant='smallLabel2' color='secondary'>
          {formattedTime}
        </Typography>
      }
      alwaysInlineAction>
      <Card classes={{ root: card }} variant='outlined'>
        <CardHeader title={title} classes={{ root: cardHeader }} disableTypography />
        <CardContent classes={{ root: cardContent }}>
          <Grid container item>
            <Grid item XSmall={12} classes={{ root: miniChartContainer }}>
              <AnalyticsConfigChart
                chartKeyOrConfig={RAQIV2PredefinedChartKey.OverviewMiniConcurrentPlayers}
                chartContext={chartContext}
                onSelectChartRegion={null}
                eventLogging={chartEventLogging}
                chartHeight={72}
                renderWithoutPeripherals
                overlays={[]}
                showStartAndEndXAxisTickOnly
              />
            </Grid>
            <Grid container item gap={3} classes={{ root: summaryItemsContainer }}>
              {summaryItemKeys.map((key) => (
                <Grid
                  key={key}
                  item
                  XSmall={12}
                  display='flex'
                  direction='row'
                  alignItems='flex-end'>
                  <RAQIV2PredefinedSummaryItem
                    predefinedKey={key}
                    chartContext={metricStatsContext}
                    variant='compact'
                  />
                  <Grid item marginBottom='5px'>
                    <RAQIV2PredefinedSummaryComparisonChip
                      predefinedKey={key}
                      chartContext={chartContext}
                      eventLogging={summaryItemEventLogging}
                    />
                  </Grid>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </CardContent>
        <CardActions classes={{ root: cardActions }}>
          <Link
            data-testid='see-more-link'
            href={buildExperienceAnalyticsUrlWithParams(
              analyticsPerformanceNavigationItem,
              {},
              universeId,
            )}
            underline='none'
            onClick={onClickSeeMore}>
            <Button variant='Standard' size='Small' color='primaryBrand'>
              {translate(translationKey('Label.SeeMore', TranslationNamespace.Analytics))}
            </Button>
          </Link>
        </CardActions>
      </Card>
    </Section>
  );
};

export default PerformanceRealtimeCard;
