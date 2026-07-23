import type { FC } from 'react';
import { useMemo } from 'react';
import type { SelectionCallback } from '@rbx/analytics-ui';
import {
  ChartStyleMode,
  ColumnChart,
  ChartColor,
  SeriesDataTypes,
  SingleChartCardContainer,
} from '@rbx/analytics-ui';
import {
  RAQIV2DateRangeType,
  RAQIV2MetricGranularity,
  RAQIV2Metric,
  RAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import { Grid } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import TimeSeriesChartExporter from '@modules/charts-generic/charts/exporters/TimeSeriesChartExporter';
import { useXAxisFormatter } from '@modules/charts-generic/charts/formatters/axisFormatters';
import { useDownloadAction } from '@modules/charts-generic/charts/GenericChartExportButton';
import useChartSummarySpecs from '@modules/charts-generic/charts/hooks/useChartSummarySpecs';
import useTimeSeriesChartTooltipFormatters from '@modules/charts-generic/charts/hooks/useTimeSeriesChartTooltipFormatters';
import useLocale from '@modules/charts-generic/context/useLocale';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import genericChartStateToChartAbnormalState from '@modules/experience-analytics-shared/components/RAQIV2/genericChartStateToChartAbnormalState';
import useExperienceAnalyticsCurrentXAxisGranularity from '@modules/experience-analytics-shared/context/useExperienceAnalyticsCurrentXAxisGranularity';
import useCurrentAnnotationsBundleProvider from '@modules/experience-analytics-shared/hooks/useCurrentAnnotationsBundleProvider';
import useRAQIV2Request from '@modules/experience-analytics-shared/hooks/useRAQIV2Request';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import useTimeSeriesWebbloxAnnotations from '@modules/experience-analytics-shared/hooks/useTimeSeriesWebbloxAnnotations';
import type RAQIV2ChartSpec from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';
import {
  FetchComparisonSeriesMode,
  type MakeRAQIV2RequestOptions,
} from '@modules/experience-analytics-shared/utils/makeRAQIV2Request';
import { getMetricLabelFromMetricLike } from '@modules/experience-analytics-shared/utils/metricLikeSemantics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
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
  const granularity: RAQIV2MetricGranularity = RAQIV2MetricGranularity.OneDay;
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
        rangeType: RAQIV2DateRangeType.Custom,
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
      fetchComparison: { mode: FetchComparisonSeriesMode.Combined, granularity },
    }),
    [granularity],
  );

  const {
    data: raqiData,
    isDataLoading,
    isUserForbidden,
    isResponseFailed,
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- TODO(shumingxu): Remove in DSA-4491
    isNoDataAvailable,
  } = useRAQIV2Request(spec, RAQIV2RequestOptions);

  const { chart, summary } = useMemo(() => {
    return PlayerFeedbackVoteChartAdapter({
      responses: raqiData ?? { response: null },
      spec,
      translationDependencies,
      granularity,
    });
  }, [raqiData, translationDependencies, granularity, spec]);

  const exporter = useMemo(() => {
    return new TimeSeriesChartExporter(
      getMetricLabelFromMetricLike(RAQIV2Metric.PlayerFeedbackVotesCount, translationDependencies),
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
    granularity,
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
    granularity,
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
        tPendingTranslation: translationDependencies.tPendingTranslation,
      }),
    [
      isDataLoading,
      isUserForbidden,
      isResponseFailed,
      isNoDataAvailable,
      translationDependencies.translate,
      translationDependencies.tPendingTranslation,
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
