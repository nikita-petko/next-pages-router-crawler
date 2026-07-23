import {
  TimeSeriesSplineChartSpec,
  ChartSummaryItemSpec,
  SeriesIntervalMeaning,
  TNumberContextMetadata,
  TimeSeriesInfo,
  Timestamp,
} from '@modules/charts-generic';

import { FormattedText, translationKey } from '@modules/analytics-translations';

import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { AnalyticsDataStatus } from '@modules/clients/analytics';
import { SeriesDataTypes, SeriesCustomMetaData } from '@rbx/analytics-ui';
import {
  buildChartUnitOptions,
  TimeSeriesInfoWithDataStatusZones,
} from './genericRAQIV2ChartAdapter';
import { RAQIV2SummarySpec } from './genericRAQIV2ChartSummaryAdapter';
import RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import adaptAllRaqiV2SeriesWithComparisonAndSummary from './genericRAQIV2ChartAdapterWithComparison';
import combineRAQIV2QueryResponses, {
  RAQIV2QueryResponses,
} from '../utils/combineRAQIV2QueryResponses';
import { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';

export type GenericRAQIV2TimeSeriesSplineChartAdapterProps = {
  responses: RAQIV2QueryResponses;
  spec: RAQIV2ChartSpec;
  translationDependencies: RAQIV2TranslationDependencies;
  seriesIntervalMeaning: SeriesIntervalMeaning;
  summarySpec: RAQIV2SummarySpec;
  showComparisonInChart?: boolean;
  hideTotalSeriesInChart?: boolean;
  numberContextMetadata?: TNumberContextMetadata;
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
        `Unhandled AnalyticsDataStatus in convertDataStatusToChartType: ${exhaustiveCheck}`,
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
  if (isComparisonSeries) return SeriesDataTypes.Comparison;
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
  seriesIntervalMeaning,
  showComparisonInChart = false,
  hideTotalSeriesInChart = false,
  numberContextMetadata,
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
        seriesIntervalMeaning,
        spec,
      },
      summarySpec,
      comparisonResponse,
      numberContextMetadata,
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
