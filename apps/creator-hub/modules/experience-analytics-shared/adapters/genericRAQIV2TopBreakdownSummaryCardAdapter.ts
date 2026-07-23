import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { NumericChartSummaryItemSpec } from '@modules/charts-generic/charts/ChartSummaryItem';
import { filterNumericChartSummaryItemSpecs } from '@modules/charts-generic/charts/ChartSummaryItem';
import type { RAQIV2CompoundSingleMetricSummaryType } from '../enums/RAQIV2SummaryType';
import { RAQIV2SummaryType } from '../enums/RAQIV2SummaryType';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import type { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import type { RAQIV2QueryResponses } from '../utils/combineRAQIV2QueryResponses';
import combineRAQIV2QueryResponses from '../utils/combineRAQIV2QueryResponses';
import { ingestAllRaqiV2Series } from './genericRAQIV2ChartAdapter';
import { summarizeSeriesInfo } from './genericRAQIV2ChartSummaryAdapter';

type GenericRAQIV2TopBreakdownSummaryCardAdapterProps = {
  responses: RAQIV2QueryResponses;
  spec: RAQIV2ChartSpec;
  summaryType: RAQIV2CompoundSingleMetricSummaryType;
  translationDependencies: RAQIV2TranslationDependencies;
  granularity: RAQIV2MetricGranularity;
};

const genericRAQIV2TopBreakdownSummaryCardAdapter = ({
  responses,
  spec,
  summaryType,
  translationDependencies,
  granularity,
}: GenericRAQIV2TopBreakdownSummaryCardAdapterProps): {
  summary: NumericChartSummaryItemSpec | null;
} => {
  if (
    summaryType.type === RAQIV2SummaryType.Average &&
    spec.granularity === RAQIV2MetricGranularity.None
  ) {
    throw new Error('Currently cannot process average summary for non-time series data');
  }

  if (!spec.breakdown?.length) {
    throw new Error('Top breakdown summary requires a breakdown');
  }

  const { response } = combineRAQIV2QueryResponses(responses);

  const { series } = ingestAllRaqiV2Series({
    response,
    translationDependencies,
    granularity,
    spec,
  });

  const summary = filterNumericChartSummaryItemSpecs(
    summarizeSeriesInfo(
      series,
      spec,
      {
        totalSummaryTypes: [],
        perBreakdownSummaryTypes: [summaryType],
        aggregatedBreakdownSummaryTypes: [],
      },
      translationDependencies,
      null,
    ),
  );

  if (!summary.length) {
    return { summary: null };
  }

  const topSummary = summary.reduce((prev, current) =>
    prev && prev.value > current.value ? prev : current,
  );
  return { summary: topSummary };
};

export default genericRAQIV2TopBreakdownSummaryCardAdapter;
