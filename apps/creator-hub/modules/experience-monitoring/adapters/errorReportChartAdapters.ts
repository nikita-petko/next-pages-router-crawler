import {
  buildSeriesInfo,
  ChartUnit,
  ChartUnitAggregationType,
  getTotalFromPointsSeries,
  ingestRAQIMetricValues,
  processTimestamps,
  RAQIBreakdownValue,
  RAQIMetricValue,
  RAQIResponse,
  SortedSeriesInfo,
  sortTotalBreakdownFirst,
  TimeSeriesSplineChartSpec,
  Timestamp,
  totalDatapointsAcrossSeries,
  InfillBehavior,
  SeriesIntervalMeaning,
  logAnalyticsError,
  NumericChartSummaryItemSpec,
  SummaryValueType,
} from '@modules/charts-generic';

import {
  FormattedText,
  TranslationKey,
  translationKey,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations';

import {
  ErrorLoggingDimensionOption,
  ErrorSourceTranslationKeys,
} from '@modules/experience-analytics-shared';

import { Locale } from '@rbx/intl';

import {
  ErrorLoggingDimension,
  UniversePerformanceDimension,
} from '@modules/clients/analytics/universePerformanceRaqi';

import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { SeriesDataTypes } from '@rbx/analytics-ui';
import { ErrorReportChartSpec } from '../types/ErrorReportChartSpec';

type BreakdownSpec<RAQIDimension> = Array<RAQIBreakdownValue<RAQIDimension>>;

const BreakdownUnknown = 'Label.Unknown';
const translationKeyForProductTypeBreakdown = (
  breakdownSpec: BreakdownSpec<UniversePerformanceDimension>,
): TranslationKey => {
  if (!breakdownSpec.length) {
    // Empty array => totals
    return translationKey('Label.Total', TranslationNamespace.Analytics);
  }

  if (breakdownSpec.length > 1) {
    logAnalyticsError('errorReport: multiple breakdowns provided -- unsupported');
    return translationKey(BreakdownUnknown, TranslationNamespace.Analytics);
  }

  const breakdown = breakdownSpec[0];
  const { dimension, value } = breakdown;

  switch (dimension) {
    case ErrorLoggingDimension.LogSource: {
      const definedKey = ErrorSourceTranslationKeys[value as ErrorLoggingDimensionOption];
      return definedKey || translationKey(BreakdownUnknown, TranslationNamespace.Analytics);
    }
    case ErrorLoggingDimension.Keyword:
    case ErrorLoggingDimension.Place:
    case ErrorLoggingDimension.PlaceVersion:
    case ErrorLoggingDimension.LogSeverity:
      logAnalyticsError(`errorLog: breakdown dimension ${dimension} -- unsupported`);
      return translationKey('Label.Unknown', TranslationNamespace.Analytics);
    default: {
      const exhaustiveCheck: never = dimension;
      throw new Error(`Unhandled dimension ${exhaustiveCheck}`);
    }
  }
};

const formatSummary = (
  seriesInfo: SortedSeriesInfo<BreakdownSpec<UniversePerformanceDimension>>,
  sortedTimestamps: Array<Timestamp>,
): Array<NumericChartSummaryItemSpec> => {
  if (!sortedTimestamps.length) {
    return [];
  }

  return [
    {
      summaryValueType: SummaryValueType.Numeric,
      unit: ChartUnit.Results,
      type: ChartUnitAggregationType.SummaryTotal,
      value: totalDatapointsAcrossSeries(seriesInfo),
      correspondingBreakdowns: [],
    },
  ];
};

export const overrideDataType = (
  legendName: FormattedText,
  translate: TranslationKeyToFormattedText,
) => {
  // TODO(gperkins@ 20231030): This is really bad, nothing should ever be matching
  //  against translated text. buildSeriesInfo should have been modified to accept
  //  another param.
  if (
    legendName ===
    translate(translationKey('Label.OneHundredPercentEfficiency', TranslationNamespace.Analytics))
  ) {
    return SeriesDataTypes.Quota;
  }
  return SeriesDataTypes.Normal;
};

type PerformanceChartAdapterArgs = {
  response: RAQIResponse<UniversePerformanceDimension> | null;
  spec: ErrorReportChartSpec;
  translate: TranslationKeyToFormattedText;
  locale: Locale;
  seriesIntervalMeaning: SeriesIntervalMeaning;
};
const errorReportChartAdapters = ({
  response,
  translate,
  locale,
  spec,
  seriesIntervalMeaning,
}: PerformanceChartAdapterArgs): {
  chart: TimeSeriesSplineChartSpec;
  summary: Array<NumericChartSummaryItemSpec>;
} => {
  const { endDate } = spec;

  const allSeries: Array<RAQIMetricValue<UniversePerformanceDimension>> = response?.values ?? [];
  const { allTimestamps, pointsBySeries } = ingestRAQIMetricValues(allSeries);
  const sortedTimestamps = processTimestamps(allTimestamps, seriesIntervalMeaning, endDate);

  const nameFn = (breakdownSpec: BreakdownSpec<UniversePerformanceDimension>) =>
    translate(translationKeyForProductTypeBreakdown(breakdownSpec));

  const seriesInfo = buildSeriesInfo({
    pointsBySeries,
    sortedTimestamps,
    seriesIntervalMeaning,
    locale,
    translateNameFn: nameFn,
    summaryLabelFn: nameFn,
    sortFn: sortTotalBreakdownFirst,
    infillBehavior: InfillBehavior.ZeroIfNotNull,
  });

  // INFO(cmccarty@20230510) The sessionTime and ErrorReport summaries need to look at just the total dimension,
  // ignoring the other dimensions.
  // SessionTime is a little unique because we very specifically want to average the total dimension.
  // ErrorReport and ConcurrentUsers we could take either the total dimension, or everything except the total dimension
  const partialSeriesInfo = buildSeriesInfo({
    pointsBySeries: getTotalFromPointsSeries(pointsBySeries),
    sortedTimestamps,
    seriesIntervalMeaning,
    locale,
    translateNameFn: nameFn,
    summaryLabelFn: nameFn,
    sortFn: sortTotalBreakdownFirst,
    infillBehavior: InfillBehavior.ZeroIfNotNull,
  });

  const summary = formatSummary(partialSeriesInfo, sortedTimestamps);

  return {
    chart: {
      unit: {
        unit: ChartUnit.Results,
        type: ChartUnitAggregationType.SummaryTotal,
        display: translate(
          translationKey('Title.ErrorReportChart', TranslationNamespace.Analytics),
        ),
      },
      timestamps: sortedTimestamps,
      series: seriesInfo.map(({ data, legendName }) => ({
        name: legendName,
        dataPoints: data,
        type: overrideDataType(legendName, translate),
        zones: [],
      })),
    },
    summary,
  };
};

export default errorReportChartAdapters;
