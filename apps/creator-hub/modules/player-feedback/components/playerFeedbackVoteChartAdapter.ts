import {
  SeriesIntervalMeaning,
  TimeSeriesStackedColumnChartSpec,
  TNumberContextMetadata,
  ChartUnit,
  ChartUnitAggregationType,
  getComparisonTimeRange,
  getComparisonChipSpec,
  TimeSeriesInfo,
  getComparisonChipTooltip,
  SummaryValueType,
  NumericChartSummaryItemSpec,
} from '@modules/charts-generic';
import { FormattedText, translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  RAQIV2ChartSpec,
  RAQIV2TranslationDependencies,
  RAQIV2QueryResponses,
  ingestAllRaqiV2Series,
  combineRAQIV2QueryResponses,
} from '@modules/experience-analytics-shared';

type PlaterFeedbackVoteChartAdapterProps = {
  responses: RAQIV2QueryResponses;
  spec: RAQIV2ChartSpec;
  translationDependencies: RAQIV2TranslationDependencies;
  seriesIntervalMeaning: SeriesIntervalMeaning;
  numberContextMetadata?: TNumberContextMetadata;
};

const getAbsTotalByBreakDown = (series: TimeSeriesInfo[]): { [k: string]: number } => {
  const result = Object.fromEntries(
    series.map((obj) => [
      obj.name,
      obj.dataPoints.reduce((sum, [, value]) => sum + Math.abs(value ?? 0), 0),
    ]),
  );
  return result;
};

const getSumforAllBreakdown = (votesCountbyBreakdown: { [k: string]: number }): number => {
  return Object.values(votesCountbyBreakdown).reduce((sum, value) => sum + (value as number), 0);
};

const getVotesCountChartSummaryItem = (
  value: number,
  previousValue: number,
  unit: ChartUnit,
  type: ChartUnitAggregationType,
  specificLabel: FormattedText | undefined,
  tooltip: FormattedText,
  numberContextMetadata?: TNumberContextMetadata,
  hasBackground: boolean = true,
  isPositiveGood: boolean = true,
): NumericChartSummaryItemSpec => {
  return {
    summaryValueType: SummaryValueType.Numeric,
    unit,
    type,
    value,
    specificLabel,
    correspondingBreakdowns: [],
    comparisonChipSpec: getComparisonChipSpec({
      isPositiveGood,
      current: value,
      previous: previousValue,
      hasBackground,
      tooltip,
    }),
    numberContextMetadata,
  };
};

const PlayerFeedbackVoteChartAdapter = ({
  responses,
  spec,
  translationDependencies,
  seriesIntervalMeaning,
  numberContextMetadata,
}: PlaterFeedbackVoteChartAdapterProps): {
  chart: TimeSeriesStackedColumnChartSpec;
  summary: Array<NumericChartSummaryItemSpec>;
} => {
  const { response, comparisonResponse } = combineRAQIV2QueryResponses(responses);
  const { translate } = translationDependencies;
  const { series, timestamps } = ingestAllRaqiV2Series({
    response,
    translationDependencies,
    seriesIntervalMeaning,
    spec,
  });
  const rawComparisonSeries = comparisonResponse
    ? ingestAllRaqiV2Series({
        response: comparisonResponse,
        translationDependencies,
        seriesIntervalMeaning,
        spec,
      }).series
    : undefined;
  const { comparisonStartDate, comparisonEndDate } = getComparisonTimeRange(
    spec.timeSpec.startTime,
    spec.timeSpec.endTime,
    seriesIntervalMeaning,
  );

  const chart: TimeSeriesStackedColumnChartSpec = {
    unit: {
      unit: ChartUnit.Results,
      display: translate(translationKey('', TranslationNamespace.Analytics)),
      type: ChartUnitAggregationType.SummaryTotal,
    },
    timestamps,
    series: series
      .filter(({ isTotalSeries }) => !isTotalSeries)
      .map(({ name, dataPoints, isTotalSeries }) => ({
        name,
        dataPoints,
        isTotal: isTotalSeries,
      })),
  };

  const votesCountbyBreakdown = getAbsTotalByBreakDown(series);
  const votesCountSum = getSumforAllBreakdown(votesCountbyBreakdown);
  const preVotesCountByBreakdown = getAbsTotalByBreakDown(rawComparisonSeries ?? []);
  const preVotesCountSum = getSumforAllBreakdown(preVotesCountByBreakdown);

  const tooltip = getComparisonChipTooltip({
    translate: translationDependencies.translate,
    startDate: spec.timeSpec.startTime,
    endDate: spec.timeSpec.endTime,
    comparisonStartDate,
    comparisonEndDate,
  });

  const formatSummary: NumericChartSummaryItemSpec[] = [
    // Total votes count summary
    getVotesCountChartSummaryItem(
      votesCountSum,
      preVotesCountSum,
      ChartUnit.Items,
      ChartUnitAggregationType.Sum,
      translate(translationKey('Label.Metric.TotalFeedback', TranslationNamespace.Analytics)),
      tooltip,
      numberContextMetadata,
    ),
    // Upvotes percentage summary
    getVotesCountChartSummaryItem(
      votesCountbyBreakdown.Upvotes / votesCountSum,
      preVotesCountByBreakdown.Upvotes / preVotesCountSum,
      ChartUnit.Percentage,
      ChartUnitAggregationType.Ratio,
      translate(translationKey('Label.Metric.PercentUpvotes', TranslationNamespace.Analytics)),
      tooltip,
      numberContextMetadata,
    ),
  ];

  return {
    chart,
    summary: formatSummary,
  };
};

export default PlayerFeedbackVoteChartAdapter;
