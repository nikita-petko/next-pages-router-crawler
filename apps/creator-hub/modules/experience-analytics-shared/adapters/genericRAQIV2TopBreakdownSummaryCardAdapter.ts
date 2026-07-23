import {
  filterNumericChartSummaryItemSpecs,
  NumericChartSummaryItemSpec,
  SeriesIntervalMeaning,
} from '@modules/charts-generic';

import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { ingestAllRaqiV2Series } from './genericRAQIV2ChartAdapter';
import { summarizeSeriesInfo } from './genericRAQIV2ChartSummaryAdapter';
import RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import combineRAQIV2QueryResponses, {
  RAQIV2QueryResponses,
} from '../utils/combineRAQIV2QueryResponses';
import { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import RAQIV2SummaryType, {
  RAQIV2CompoundSingleMetricSummaryType,
} from '../enums/RAQIV2SummaryType';

type GenericRAQIV2TopBreakdownSummaryCardAdapterProps = {
  responses: RAQIV2QueryResponses;
  spec: RAQIV2ChartSpec;
  summaryType: RAQIV2CompoundSingleMetricSummaryType;
  translationDependencies: RAQIV2TranslationDependencies;
  seriesIntervalMeaning: SeriesIntervalMeaning;
};

const genericRAQIV2TopBreakdownSummaryCardAdapter = ({
  responses,
  spec,
  summaryType,
  translationDependencies,
  seriesIntervalMeaning,
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
    seriesIntervalMeaning,
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
