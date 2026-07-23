import { FC, useCallback, useMemo } from 'react';
import {
  AnalyticsConfigChart,
  ChartLoggingContext,
  formatAnalyticsNumber,
  RAQIV2PredefinedChartKey,
  RAQIV2PredefinedSummaryComparisonChip,
  RAQIV2PredefinedSummaryItem,
  RAQIV2PredefinedSummaryItemConfig,
  RAQIV2PredefinedSummaryItemKey,
  TChartEventLogging,
  useLiveConcurrentPlayerStats,
  useRAQIV2TranslationDependencies,
  useUniversePerformanceRaqiClientProvider,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import { RAQIV2MetricGranularity, RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import {
  analyticsPerformanceNavigationItem,
  buildExperienceAnalyticsUrlWithParams,
  dateRangeOffsetDays,
  DateRangeType,
  getCurrentDate,
  noDataSymbol,
  NumberContext,
  useLocale,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { dateTimeFormatter, subDays } from '@rbx/core';
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
import { Button } from '@rbx/foundation-ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { Link } from '@modules/miscellaneous/common';
import usePerformanceRealtimeCardStyles from './PerformanceRealtimeCard.styles';
import { logClickRealtimeSeeMore } from './logger';
import NewPlaceVersionLiveAlert from './NewPlaceVersionLiveAlert';

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

  const currentTime = useMemo(() => {
    return getCurrentDate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- update chart when live summary changes
  }, [summary]);

  const resource = useUniverseResource();
  // Display last 7 days of data for mini CCU chart
  const chartContext = useMemo(() => {
    return {
      resource,
      timeSpec: {
        startTime: subDays(currentTime, dateRangeOffsetDays[DateRangeType.Last7Days]),
        endTime: currentTime,
      },
      granularity: RAQIV2MetricGranularity.OneHour,
      // Summary cards don't have time axes
      timeAxisBounds: null,
    };
  }, [currentTime, resource]);

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

    const formattedTime = latestUpdateTime ? (
      dateTimeFormatter(locale).getCustomDateTime(latestUpdateTime, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    ) : (
      <Skeleton animate width={32} />
    );

    return (
      <Container disableGutters>
        <Typography variant='smallLabel2' display='block' color='secondary' paddingBottom={3}>
          {formattedTime}
        </Typography>
        <NewPlaceVersionLiveAlert />
        <Grid container item justifyContent='space-between' alignItems='center'>
          <Typography variant='h1'>
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
    latestUpdateTime,
    locale,
    summary,
    summaryItemEventLogging,
    translationDependencies,
  ]);

  const subHeader = useMemo(() => {
    const key =
      RAQIV2PredefinedSummaryItemConfig[
        RAQIV2PredefinedSummaryItemKey.PerformancePeakConcurrentPlayers
      ].labelKey;
    return <Typography variant='body1'>{key ? translate(key) : ''}</Typography>;
  }, [translate]);

  const metricStatsContext = useMemo(
    () => ({
      resource,
      timeSpec: {
        startTime: currentTime,
        endTime: currentTime,
      },
      granularity: RAQIV2MetricGranularity.OneMinute,
      timeAxisBounds: null,
    }),
    [currentTime, resource],
  );

  return (
    <Card classes={{ root: card }}>
      <CardHeader title={title} subheader={subHeader} classes={{ root: cardHeader }} />
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
              <Grid key={key} item XSmall={12} display='flex' direction='row' alignItems='flex-end'>
                <RAQIV2PredefinedSummaryItem
                  predefinedKey={key}
                  chartContext={metricStatsContext}
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
  );
};

export default PerformanceRealtimeCard;
