import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { NumericChartSummaryItemSpec } from '@modules/charts-generic/charts/ChartSummaryItem';
import { SummaryValueType } from '@modules/charts-generic/charts/ChartSummaryItem';
import type {
  TFormattingSpec,
  TNumberContextMetadata,
} from '@modules/charts-generic/charts/numberFormatters';
import type { TimeSeriesStackedColumnChartSpec } from '@modules/charts-generic/charts/types/TimeSeriesStackedColumnChartTypes';
import type { TimeSeriesInfo } from '@modules/charts-generic/charts/types/TimeSeriesTypes';
import {
  integerFormattingSpec,
  percentageFormattingSpec,
} from '@modules/charts-generic/constants/analyticsNumberFormattingSpec';
import ChartSummaryType from '@modules/charts-generic/enums/ChartSummaryType';
import type { SeriesIntervalMeaning } from '@modules/charts-generic/enums/SeriesIntervalMeaning';
import {
  getComparisonTimeRange,
  getComparisonChipSpec,
  getComparisonChipTooltip,
} from '@modules/charts-generic/utils/comparisonChipUtils';

type NumericChartSummaryType = NumericChartSummaryItemSpec['summaryType'];
import type { FormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
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
  seriesIntervalMeaning?: SeriesIntervalMeaning;
  granularity?: SeriesIntervalMeaning;
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
  formattingSpec: TFormattingSpec,
  summaryType: NumericChartSummaryType,
  specificLabel: FormattedText | undefined,
  tooltip: FormattedText,
  numberContextMetadata?: TNumberContextMetadata,
  hasBackground = true,
  isPositiveGood = true,
): NumericChartSummaryItemSpec => {
  return {
    summaryValueType: SummaryValueType.Numeric,
    formattingSpec,
    summaryType,
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
  seriesIntervalMeaning,
  granularity,
  numberContextMetadata,
}: PlaterFeedbackVoteChartAdapterProps): {
  chart: TimeSeriesStackedColumnChartSpec;
  summary: Array<NumericChartSummaryItemSpec>;
} => {
  const { response, comparisonResponse } = combineRAQIV2QueryResponses(responses);
  const { translate } = translationDependencies;
  const effectiveGranularity = granularity ?? seriesIntervalMeaning ?? RAQIV2MetricGranularity.None;
  const { series, timestamps } = ingestAllRaqiV2Series({
    response,
    translationDependencies,
    granularity: effectiveGranularity,
    spec,
  });
  const rawComparisonSeries = comparisonResponse
    ? ingestAllRaqiV2Series({
        response: comparisonResponse,
        translationDependencies,
        granularity: effectiveGranularity,
        spec,
      }).series
    : undefined;
  const { comparisonStartDate, comparisonEndDate } = getComparisonTimeRange(
    spec.timeSpec.startTime,
    spec.timeSpec.endTime,
    effectiveGranularity,
  );

  const chart: TimeSeriesStackedColumnChartSpec = {
    unit: {
      display: translate(translationKey('', TranslationNamespace.Analytics)),
      formattingSpec: integerFormattingSpec,
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
      integerFormattingSpec,
      ChartSummaryType.Total,
      translate(translationKey('Label.Metric.TotalFeedback', TranslationNamespace.Analytics)),
      tooltip,
      numberContextMetadata,
    ),
    // Upvotes percentage summary
    getVotesCountChartSummaryItem(
      votesCountbyBreakdown.Upvotes / votesCountSum,
      preVotesCountByBreakdown.Upvotes / preVotesCountSum,
      percentageFormattingSpec,
      ChartSummaryType.Total,
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
