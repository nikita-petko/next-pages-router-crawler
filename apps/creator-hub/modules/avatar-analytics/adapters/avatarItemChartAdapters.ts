import {
  ChartUnit,
  ChartUnitAggregationType,
  TimeSeriesSplineChartSpec,
  Timestamp,
  ChartSummaryItemSpec,
  RAQIBreakdownValue,
  RAQIMetricValue,
  RAQIResponse,
  SortedSeriesInfo,
  ingestRAQIMetricValues,
  processTimestamps,
  sortTotalBreakdownFirst,
  totalDatapointsAcrossSeries,
  getTotalFromPointsSeries,
  buildSeriesInfo,
  InfillBehavior,
  SeriesIntervalMeaning,
  logAnalyticsError,
  SummaryValueType,
} from '@modules/charts-generic';

import {
  translationKey,
  FormattedText,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations';

import { Locale } from '@rbx/intl';

import { TranslationNamespace } from '@modules/miscellaneous/localization';

import { AvatarItemDimension, AvatarItemMetric } from '@modules/clients/analytics';
import { SeriesDataTypes } from '@rbx/analytics-ui';
import { AvatarItemChartKey, AvatarItemChartSpec } from '../types/AvatarItemChartTypes';

type BreakdownSpec<RAQIDimension> = Array<RAQIBreakdownValue<RAQIDimension>>;

const getMetricName = (
  metric: AvatarItemMetric,
  translate: TranslationKeyToFormattedText,
): FormattedText => {
  switch (metric) {
    case AvatarItemMetric.SalesCount:
      return translate(translationKey('Label.Sales', TranslationNamespace.AvatarAnalytics));
    case AvatarItemMetric.Revenue:
      return translate(translationKey('Label.Revenue', TranslationNamespace.AvatarAnalytics));
    default: {
      const exhaustiveCheck: never = metric;
      throw new Error(`Unhandled metric name ${exhaustiveCheck}`);
    }
  }
};

const BreakdownUnknown = 'Label.Unknown';
const translationKeyForProductTypeBreakdown = (
  breakdownSpec: BreakdownSpec<AvatarItemDimension>,
  translate: TranslationKeyToFormattedText,
): FormattedText => {
  if (!breakdownSpec.length) {
    // Empty array => totals
    return translate(translationKey('Label.Total', TranslationNamespace.Analytics));
  }

  if (breakdownSpec.length > 1) {
    logAnalyticsError('avatar: multiple breakdowns provided -- unsupported');
    return translate(translationKey(BreakdownUnknown, TranslationNamespace.Analytics));
  }

  const breakdown = breakdownSpec[0];
  const { dimension, value } = breakdown;

  if (value === 'Total') {
    return translate(translationKey('Label.Total', TranslationNamespace.Analytics));
  }

  switch (dimension) {
    case AvatarItemDimension.Product: {
      return value as FormattedText;
    }
    default: {
      const exhaustiveCheck: never = dimension;
      throw new Error(`Unhandled dimension ${exhaustiveCheck}`);
    }
  }
};

const chartKeyToChartUnit: Record<AvatarItemChartKey, ChartUnit> = {
  [AvatarItemChartKey.Sales]: ChartUnit.Sales,
  [AvatarItemChartKey.Revenue]: ChartUnit.Robux,
};

const chartKeytoAggregationType: Record<AvatarItemChartKey, ChartUnitAggregationType> = {
  [AvatarItemChartKey.Sales]: ChartUnitAggregationType.Sum,
  [AvatarItemChartKey.Revenue]: ChartUnitAggregationType.Sum,
};

const formatSummary = (
  seriesInfo: SortedSeriesInfo<BreakdownSpec<AvatarItemDimension>>,
  sortedTimestamps: Array<Timestamp>,
  chartKey: AvatarItemChartKey,
): Array<ChartSummaryItemSpec> => {
  if (!sortedTimestamps.length) {
    return [];
  }

  let summaryNumberValue;
  switch (chartKey) {
    case AvatarItemChartKey.Sales:
    case AvatarItemChartKey.Revenue:
      summaryNumberValue = totalDatapointsAcrossSeries(seriesInfo);
      break;
    default: {
      const exhaustiveCheck: never = chartKey;
      throw new Error(`Unhandled chartKey: ${exhaustiveCheck} in formatSummary`);
    }
  }

  return [
    {
      summaryValueType: SummaryValueType.Numeric,
      unit: chartKeyToChartUnit[chartKey],
      type: chartKeytoAggregationType[chartKey],
      value: summaryNumberValue,
      correspondingBreakdowns: [],
    },
  ];
};

type AvatarItemChartAdapterArgs = {
  response: RAQIResponse<AvatarItemDimension> | null;
  spec: AvatarItemChartSpec;
  translate: TranslationKeyToFormattedText;
  locale: Locale;
  seriesIntervalMeaning: SeriesIntervalMeaning;
};
const avatarItemChartAdapters = ({
  response,
  translate,
  locale,
  spec,
  seriesIntervalMeaning,
}: AvatarItemChartAdapterArgs): {
  chart: TimeSeriesSplineChartSpec;
  summary: Array<ChartSummaryItemSpec>;
} => {
  const { metric, endDate, chartKey } = spec;

  const allSeries: Array<RAQIMetricValue<AvatarItemDimension>> = response?.values ?? [];
  const { allTimestamps, pointsBySeries } = ingestRAQIMetricValues(allSeries);
  const sortedTimestamps = processTimestamps(allTimestamps, seriesIntervalMeaning, endDate);

  const nameFn = (breakdownSpec: BreakdownSpec<AvatarItemDimension>) =>
    translationKeyForProductTypeBreakdown(breakdownSpec, translate);

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

  let summary: Array<ChartSummaryItemSpec>;
  switch (chartKey) {
    case AvatarItemChartKey.Sales:
    case AvatarItemChartKey.Revenue: {
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
      summary = formatSummary(partialSeriesInfo, sortedTimestamps, chartKey);
      break;
    }
    default: {
      const exhaustiveCheck: never = chartKey;
      throw new Error(`Unhandled chartKey: ${exhaustiveCheck} when building summary`);
    }
  }
  return {
    chart: {
      unit: {
        unit: chartKeyToChartUnit[chartKey],
        display: getMetricName(metric, translate),
        type: chartKeytoAggregationType[chartKey],
      },
      timestamps: sortedTimestamps,
      series: seriesInfo.map(({ data: dataPoints, legendName }) => ({
        name: legendName,
        dataPoints,
        type: SeriesDataTypes.Normal,
        zones: [],
      })),
    },
    summary,
  };
};

export default avatarItemChartAdapters;
