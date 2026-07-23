import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import type { TNumberContextMetadata } from '@modules/charts-generic/charts/numberFormatters';
import type { RAQIV2QueryResult } from '@modules/clients/analytics';
import type { ComparisonOverlay } from '../types/RAQIV2ChartSpec';
import getComparisonRange from '../utils/getComparisonRange';
import type { GenericRaqiV2ChartAdapterSpec } from './genericRAQIV2ChartAdapter';
import { ingestAllRaqiV2Series, ingestRaqiV2ComparisonSeries } from './genericRAQIV2ChartAdapter';
import type { RAQIV2SummarySpec } from './genericRAQIV2ChartSummaryAdapter';
import { summarizeSeriesInfo } from './genericRAQIV2ChartSummaryAdapter';

type AdaptComparisonOptions = {
  numberContextMetadata?: TNumberContextMetadata;
  relativeOffset?: ComparisonOverlay['relativeOffset'];
  customStartDate?: ComparisonOverlay['customStartDate'];
  showComparisonChip?: boolean;
};

export const adaptAllRaqiV2SeriesWithComparisonAndSummary = (
  spec: GenericRaqiV2ChartAdapterSpec,
  summarySpec: RAQIV2SummarySpec,
  comparisonResponse?: RAQIV2QueryResult,
  {
    numberContextMetadata,
    relativeOffset,
    customStartDate,
    showComparisonChip = true,
  }: AdaptComparisonOptions = {},
) => {
  const { series, timestamps } = ingestAllRaqiV2Series(spec);
  const { spec: chartSpec, translationDependencies, granularity } = spec;
  const { comparisonStartDate, comparisonEndDate } = getComparisonRange(
    chartSpec.timeSpec.startTime,
    chartSpec.timeSpec.endTime,
    granularity,
    relativeOffset,
    customStartDate,
  );
  const rawComparisonSeries = comparisonResponse
    ? ingestAllRaqiV2Series({
        ...spec,
        response: comparisonResponse,
        spec: {
          ...chartSpec,
          timeSpec: {
            ...chartSpec.timeSpec,
            rangeType: RAQIV2DateRangeType.Custom,
            startTime: comparisonStartDate,
            endTime: comparisonEndDate,
          },
        },
      }).series
    : undefined;
  const comparisonSeries = rawComparisonSeries
    ? ingestRaqiV2ComparisonSeries({
        rawComparisonSeries,
        translationDependencies: spec.translationDependencies,
        originalTimestamps: timestamps,
        // For a fixed relative offset (e.g. 7d/14d/28d) the comparison window
        // is aligned to the main window's start (drop extras from the end).
        // For "previous period" mode, align to the end (drop extras from the
        // start — the default).
        alignment: relativeOffset || customStartDate ? 'start' : 'end',
      })
    : undefined;
  const summary = summarizeSeriesInfo(
    series,
    chartSpec,
    summarySpec,
    translationDependencies,
    showComparisonChip && rawComparisonSeries
      ? {
          series: rawComparisonSeries,
          startTime: comparisonStartDate,
          endTime: comparisonEndDate,
        }
      : null,
    numberContextMetadata,
  );
  return { series, timestamps, summary, comparisonSeries };
};

export default adaptAllRaqiV2SeriesWithComparisonAndSummary;
