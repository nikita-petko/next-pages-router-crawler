import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import type { TNumberContextMetadata } from '@modules/charts-generic/charts/numberFormatters';
import { getComparisonTimeRange } from '@modules/charts-generic/utils/comparisonChipUtils';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import type { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import type { RAQIV2QueryResponses } from '../utils/combineRAQIV2QueryResponses';
import combineRAQIV2QueryResponses from '../utils/combineRAQIV2QueryResponses';
import { ingestAllRaqiV2Series } from './genericRAQIV2ChartAdapter';
import type { RAQIV2SummarySpec } from './genericRAQIV2ChartSummaryAdapter';
import { getDefaultSummarySpec, summarizeSeriesInfo } from './genericRAQIV2ChartSummaryAdapter';

type GenericRAQIV2TimeSeriesGenericChartAdapterProps = {
  responses: RAQIV2QueryResponses;
  spec: RAQIV2ChartSpec;
  translationDependencies: RAQIV2TranslationDependencies;
  summarySpec?: RAQIV2SummarySpec;
  numberContextMetadata?: TNumberContextMetadata;
};

const genericRAQIV2SeriesSummaryAdapter = ({
  responses,
  spec,
  summarySpec,
  translationDependencies,
  numberContextMetadata,
}: GenericRAQIV2TimeSeriesGenericChartAdapterProps) => {
  const { response, comparisonResponse } = combineRAQIV2QueryResponses(responses);
  const granularity = spec.granularity;

  // None/cumulative comparison uses Separate fetch (two window aggregates). The
  // previous-period range is still well-defined via equal-duration offset.
  const comparisonDates = getComparisonTimeRange(
    spec.timeSpec.startTime,
    spec.timeSpec.endTime,
    granularity,
  );

  const { series } = ingestAllRaqiV2Series({
    response,
    translationDependencies,
    granularity,
    spec,
  });

  const comparisonSeries = comparisonResponse
    ? ingestAllRaqiV2Series({
        response: comparisonResponse,
        translationDependencies,
        granularity,
        spec: {
          ...spec,
          timeSpec: {
            ...spec.timeSpec,
            rangeType: RAQIV2DateRangeType.Custom,
            startTime: comparisonDates.comparisonStartDate,
            endTime: comparisonDates.comparisonEndDate,
          },
        },
      })
    : null;

  return summarizeSeriesInfo(
    series,
    spec,
    summarySpec ?? getDefaultSummarySpec(spec),
    translationDependencies,
    comparisonSeries
      ? {
          series: comparisonSeries.series,
          startTime: comparisonDates.comparisonStartDate,
          endTime: comparisonDates.comparisonEndDate,
        }
      : null,
    numberContextMetadata,
  );
};

export default genericRAQIV2SeriesSummaryAdapter;
