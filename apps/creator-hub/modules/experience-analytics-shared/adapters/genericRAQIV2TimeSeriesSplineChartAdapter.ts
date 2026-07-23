import type { SeriesCustomMetaData } from '@rbx/analytics-ui';
import { SeriesDataTypes } from '@rbx/analytics-ui';
import type { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { FormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { ChartSummaryItemSpec } from '@modules/charts-generic/charts/ChartSummaryItem';
import type { TNumberContextMetadata } from '@modules/charts-generic/charts/numberFormatters';
import type { TimeSeriesSplineChartSpec } from '@modules/charts-generic/charts/types/TimeSeriesSplineChartTypes';
import type {
  TimeSeriesInfo,
  Timestamp,
} from '@modules/charts-generic/charts/types/TimeSeriesTypes';
import { AnalyticsDataStatus } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import type { ComparisonOverlay } from '../types/RAQIV2ChartSpec';
import type { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import type { RAQIV2QueryResponses } from '../utils/combineRAQIV2QueryResponses';
import combineRAQIV2QueryResponses from '../utils/combineRAQIV2QueryResponses';
import type { TimeSeriesInfoWithDataStatusZones } from './genericRAQIV2ChartAdapter';
import { buildChartUnitOptions } from './genericRAQIV2ChartAdapter';
import { adaptAllRaqiV2SeriesWithComparisonAndSummary } from './genericRAQIV2ChartAdapterWithComparison';
import type { RAQIV2SummarySpec } from './genericRAQIV2ChartSummaryAdapter';

export type GenericRAQIV2TimeSeriesSplineChartAdapterProps = {
  responses: RAQIV2QueryResponses;
  spec: RAQIV2ChartSpec;
  translationDependencies: RAQIV2TranslationDependencies;
  granularity: RAQIV2MetricGranularity;
  summarySpec: RAQIV2SummarySpec;
  showComparisonInChart?: boolean;
  showComparisonChip?: boolean;
  hideTotalSeriesInChart?: boolean;
  numberContextMetadata?: TNumberContextMetadata;
  comparisonRelativeOffset?: ComparisonOverlay['relativeOffset'];
  comparisonCustomStartDate?: ComparisonOverlay['customStartDate'];
};

// Convert DataStatus to chart data types for zones
const convertDataStatusToChartType = (status: AnalyticsDataStatus): SeriesDataTypes => {
  switch (status) {
    case AnalyticsDataStatus.Valid:
    case AnalyticsDataStatus.Invalid:
      return SeriesDataTypes.Normal;
    case AnalyticsDataStatus.Projected:
      return SeriesDataTypes.Projection;
    case AnalyticsDataStatus.InProgress:
    case AnalyticsDataStatus.Incomplete:
    case AnalyticsDataStatus.NotMeaningful:
      return SeriesDataTypes.Projection;
    case AnalyticsDataStatus.NotStatisticallySignificant: {
      return SeriesDataTypes.Noise;
    }
    default: {
      const exhaustiveCheck: never = status;
      throw new Error(
        `Unhandled AnalyticsDataStatus in convertDataStatusToChartType: ${String(exhaustiveCheck)}`,
      );
    }
  }
};

// Convert zones with DataStatus to zones with chart data types
const convertZonesWithDataStatusToChartTypes = (
  zones: Array<{ start: Timestamp; end: Timestamp; status: AnalyticsDataStatus }> | undefined,
): Array<{ start: Timestamp; end: Timestamp; type: SeriesDataTypes }> => {
  if (!zones) {
    return [];
  }
  return zones.map(({ start, end, status }) => ({
    start,
    end,
    type: convertDataStatusToChartType(status),
  }));
};

const getDataTypeFromSeries = (series: TimeSeriesInfo): SeriesDataTypes => {
  const { isComparisonSeries, isTotalSeries } = series;
  if (isComparisonSeries) {
    return SeriesDataTypes.Comparison;
  }
  if (isTotalSeries) {
    return SeriesDataTypes.Total;
  }
  return SeriesDataTypes.Normal;
};

const getNameFromSeries = (
  name: FormattedText,
  series: TimeSeriesInfo,
  withComparison: boolean,
  translationDependencies: RAQIV2TranslationDependencies,
) => {
  if (!series.isComparisonSeries && withComparison) {
    return translationDependencies.translate(
      translationKey('Label.CurrentSeriesComparison', TranslationNamespace.Analytics),
      {
        series: name,
      },
    );
  }

  return name;
};

const getCustomDataFromSeries = (series: TimeSeriesInfo): SeriesCustomMetaData | undefined => {
  return series.imageUrl
    ? {
        imageUrl: series.imageUrl,
      }
    : undefined;
};

export const decorateSeries = (
  allSeries: TimeSeriesInfoWithDataStatusZones[],
  translationDependencies: RAQIV2TranslationDependencies,
) => {
  const withComparison = allSeries.some((series) => series.isComparisonSeries);
  return allSeries.map((current) => {
    const { zones, ...currentTimeSeries } = current;
    const { name, dataPoints, breakdownValues } = currentTimeSeries;
    return {
      name: getNameFromSeries(name, current, withComparison, translationDependencies),
      dataPoints,
      custom: getCustomDataFromSeries(current),
      type: getDataTypeFromSeries(current),
      zones: convertZonesWithDataStatusToChartTypes(zones),
      breakdownValues,
    };
  });
};

const genericRAQIV2TimeSeriesSplineChartAdapter = ({
  responses,
  spec,
  translationDependencies,
  summarySpec,
  granularity,
  showComparisonInChart = false,
  showComparisonChip = true,
  hideTotalSeriesInChart = false,
  numberContextMetadata,
  comparisonRelativeOffset,
  comparisonCustomStartDate,
}: GenericRAQIV2TimeSeriesSplineChartAdapterProps): {
  chart: TimeSeriesSplineChartSpec;
  summary: Array<ChartSummaryItemSpec>;
} => {
  const { response, comparisonResponse } = combineRAQIV2QueryResponses(responses);
  const { series, timestamps, summary, comparisonSeries } =
    adaptAllRaqiV2SeriesWithComparisonAndSummary(
      {
        response,
        translationDependencies,
        granularity,
        spec,
      },
      summarySpec,
      comparisonResponse,
      {
        numberContextMetadata,
        relativeOffset: comparisonRelativeOffset,
        customStartDate: comparisonCustomStartDate,
        showComparisonChip,
      },
    );

  let allSeries: TimeSeriesInfoWithDataStatusZones[] =
    showComparisonInChart && comparisonSeries ? [...series, ...comparisonSeries] : series;
  if (hideTotalSeriesInChart) {
    allSeries = allSeries.filter((s) => !s.isTotalSeries);
  }

  const chart = {
    unit: buildChartUnitOptions(spec, translationDependencies),
    timestamps,
    series: decorateSeries(allSeries, translationDependencies),
  };
  return {
    chart,
    summary,
  };
};

export default genericRAQIV2TimeSeriesSplineChartAdapter;
