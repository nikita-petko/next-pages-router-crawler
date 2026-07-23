import React, { FC, useMemo } from 'react';
import {
  DailyTimeSeriesAlignedToUTCMidnight,
  SeriesIntervalMeaning,
  ChartResourceType,
  TimeSeriesChartExporter,
  useTimeSeriesChartTooltipFormatters,
  useXAxisFormatter,
  useChartSummarySpecs,
  useLocale,
  useDownloadAction,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import {
  ChartStyleMode,
  ColumnChart,
  ChartColor,
  SeriesDataTypes,
  SelectionCallback,
  SingleChartCardContainer,
} from '@rbx/analytics-ui';
import {
  useExperienceAnalyticsCurrentXAxisGranularity,
  useRAQIV2Request,
  useRAQIV2TranslationDependencies,
  useCurrentAnnotationsBundleProvider,
  RAQIV2ChartSpec,
  FetchComparisonSeriesMode,
  MakeRAQIV2RequestOptions,
  genericChartStateToChartAbnormalState,
  useTimeSeriesWebbloxAnnotations,
} from '@modules/experience-analytics-shared';
import {
  RAQIV2MetricGranularity,
  RAQIV2Metric,
  RAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Grid } from '@rbx/ui';
import PlayerFeedbackVoteChartAdapter from './playerFeedbackVoteChartAdapter';

type PlayerFeedbackVoteChartProps = {
  universeId: number;
  startDate: Date;
  endDate: Date;
  onSelectChartRegion: null | SelectionCallback<number>;
};

const PlayerFeedbackVoteChart: FC<PlayerFeedbackVoteChartProps> = ({
  universeId,
  startDate,
  endDate,
  onSelectChartRegion,
}) => {
  const locale = useLocale();
  const translationDependencies = useRAQIV2TranslationDependencies();
  const seriesIntervalMeaning: SeriesIntervalMeaning = DailyTimeSeriesAlignedToUTCMidnight;
  const xAxisGranularity = useExperienceAnalyticsCurrentXAxisGranularity();
  const { timeSeriesAnnotations } = useCurrentAnnotationsBundleProvider(ChartResourceType.Universe);

  const spec: RAQIV2ChartSpec = useMemo(
    () => ({
      resource: {
        type: ChartResourceType.Universe,
        id: universeId,
      },
      metric: RAQIV2Metric.PlayerFeedbackVotesCount,
      timeSpec: {
        startTime: startDate,
        endTime: endDate,
      },
      granularity: RAQIV2MetricGranularity.OneDay,
      breakdown: [RAQIV2Dimension.VoteType],
      filter: [],
      // This is the only chart on the page so we can get away without controlling the time axis here
      timeAxisBounds: null,
    }),
    [universeId, startDate, endDate],
  );

  const RAQIV2RequestOptions: MakeRAQIV2RequestOptions = useMemo(
    () => ({
      fetchTotalSeries: false,
      fetchComparison: { mode: FetchComparisonSeriesMode.Combined, seriesIntervalMeaning },
    }),
    [seriesIntervalMeaning],
  );

  const {
    data: raqiData,
    isDataLoading,
    isUserForbidden,
    isResponseFailed,
    // eslint-disable-next-line deprecation/deprecation -- TODO(shumingxu): Remove in DSA-4491
    isNoDataAvailable,
  } = useRAQIV2Request(spec, RAQIV2RequestOptions);

  const { chart, summary } = useMemo(() => {
    return PlayerFeedbackVoteChartAdapter({
      responses: raqiData ?? { response: null },
      spec,
      translationDependencies,
      seriesIntervalMeaning,
    });
  }, [raqiData, translationDependencies, seriesIntervalMeaning, spec]);

  const exporter = useMemo(() => {
    return new TimeSeriesChartExporter(
      RAQIV2Metric.PlayerFeedbackVotesCount,
      chart,
      translationDependencies.translate,
      translationDependencies.translate(
        translationKey('Title.PlayerFeedbackVotesCountByVoteType', TranslationNamespace.Analytics),
      ),
    );
  }, [chart, translationDependencies]);

  const downloadAction = useDownloadAction({
    kpiType: RAQIV2Metric.PlayerFeedbackVotesCount,
    exporter,
  });

  const xAxisFormatter = useXAxisFormatter(
    locale,
    seriesIntervalMeaning,
    xAxisGranularity,
    ChartStyleMode.Normal,
  );

  const annotations = useTimeSeriesWebbloxAnnotations({
    timeSeriesAnnotations: timeSeriesAnnotations ?? [],
    timeAxisSpec: { startDate, endDate },
  });

  const dataForColumnChart = useMemo(() => {
    return {
      series: chart.series.map(({ name, dataPoints, isTotal }) => ({
        name,
        dataPoints,
        type: isTotal ? (SeriesDataTypes.Total as const) : (SeriesDataTypes.Normal as const),
        color: name === 'Upvotes' ? ChartColor.Green : ChartColor.Blue,
      })),
    };
  }, [chart.series]);

  const tooltipFormatters = useTimeSeriesChartTooltipFormatters({
    chartUnitSpec: chart.unit,
    seriesIntervalMeaning,
    series: dataForColumnChart.series,
    timeAxisSpec: { startDate, endDate },
  });

  const xAxisType = useMemo(
    () => ({
      type: 'datetime' as const,
      granularity: xAxisGranularity,
    }),
    [xAxisGranularity],
  );

  const abnormalState = useMemo(
    () =>
      genericChartStateToChartAbnormalState({
        state: {
          isDataLoading,
          isUserForbidden,
          isResponseFailed,
          isNoDataAvailable,
        },
        translate: translationDependencies.translate,
      }),
    [
      isDataLoading,
      isUserForbidden,
      isResponseFailed,
      isNoDataAvailable,
      translationDependencies.translate,
    ],
  );

  const chartSummarySpecs = useChartSummarySpecs(summary);

  return (
    <Grid item XSmall={12}>
      <SingleChartCardContainer
        titleLabel={translationDependencies.translate(
          translationKey(
            'Title.PlayerFeedbackVotesCountByVoteType',
            TranslationNamespace.Analytics,
          ),
        )}
        chartSummarySpecs={chartSummarySpecs}
        downloadAction={downloadAction}
        abnormalState={abnormalState}>
        <ColumnChart
          data={dataForColumnChart}
          {...tooltipFormatters}
          xAxisFormatter={xAxisFormatter}
          xAxisType={xAxisType}
          onSelectChartRegion={onSelectChartRegion ?? undefined}
          annotations={annotations}
        />
      </SingleChartCardContainer>
    </Grid>
  );
};

export default PlayerFeedbackVoteChart;
