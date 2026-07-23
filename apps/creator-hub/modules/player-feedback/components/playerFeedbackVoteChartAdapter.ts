import type { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { FormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { NumericChartSummaryItemSpec } from '@modules/charts-generic/charts/ChartSummaryItem';
import { SummaryValueType } from '@modules/charts-generic/charts/ChartSummaryItem';
import type { TNumberContextMetadata } from '@modules/charts-generic/charts/numberFormatters';
import {
  ChartUnit,
  ChartUnitAggregationType,
} from '@modules/charts-generic/charts/types/ChartTypes';
import type { TimeSeriesStackedColumnChartSpec } from '@modules/charts-generic/charts/types/TimeSeriesStackedColumnChartTypes';
import type { TimeSeriesInfo } from '@modules/charts-generic/charts/types/TimeSeriesTypes';
import {
  getComparisonTimeRange,
  getComparisonChipSpec,
  getComparisonChipTooltip,
} from '@modules/charts-generic/utils/comparisonChipUtils';
import { ingestAllRaqiV2Series } from '@modules/experience-analytics-shared/adapters/genericRAQIV2ChartAdapter';
import type RAQIV2ChartSpec from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';
import type { RAQIV2TranslationDependencies } from '@modules/experience-analytics-shared/types/RAQIV2DimensionRenderer';
import combineRAQIV2QueryResponses from '@modules/experience-analytics-shared/utils/combineRAQIV2QueryResponses';
import type { RAQIV2QueryResponses } from '@modules/experience-analytics-shared/utils/combineRAQIV2QueryResponses';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type PlaterFeedbackVoteChartAdapterProps = {
  responses: RAQIV2QueryResponses;
  spec: RAQIV2ChartSpec;
  translationDependencies: RAQIV2TranslationDependencies;
  granularity: RAQIV2MetricGranularity;
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
  return Object.values(votesCountbyBreakdown).reduce((sum, value) => sum + value, 0);
};

const getVotesCountChartSummaryItem = (
  value: number,
  previousValue: number,
  unit: ChartUnit,
  type: ChartUnitAggregationType,
  specificLabel: FormattedText | undefined,
  tooltip: FormattedText,
  numberContextMetadata?: TNumberContextMetadata,
  hasBackground = true,
  isPositiveGood = true,
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

const playerFeedbackVoteChartAdapter = ({
  responses,
  spec,
  translationDependencies,
  granularity,
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
    granularity,
    spec,
  });
  const rawComparisonSeries = comparisonResponse
    ? ingestAllRaqiV2Series({
        response: comparisonResponse,
        translationDependencies,
        granularity,
        spec,
      }).series
    : undefined;
  const { comparisonStartDate, comparisonEndDate } = getComparisonTimeRange(
    spec.timeSpec.startTime,
    spec.timeSpec.endTime,
    granularity,
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

export default playerFeedbackVoteChartAdapter;
