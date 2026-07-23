import { Locale } from '@rbx/intl';
import {
  ChartUnit,
  ChartUnitAggregationType,
  TimeSeriesSplineChartSpec,
  Timestamp,
  RAQIBreakdownValue,
  RAQIMetricValue,
  RAQIResponse,
  SortedSeriesInfo,
  ingestRAQIMetricValues,
  processTimestamps,
  sortTotalBreakdownFirst,
  totalDatapointsAcrossSeries,
  buildSeriesInfo,
  InfillBehavior,
  DailyTimeSeriesAlignedToUTCMidnight,
  logAnalyticsError,
  SummaryValueType,
  NumericChartSummaryItemSpec,
} from '@modules/charts-generic';

import {
  TranslationKey,
  translationKey,
  FormattedText,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations';

import { TranslationNamespace } from '@modules/miscellaneous/localization';

import { DeveloperSubscriptionsAnalyticsDimension } from '@rbx/clients/developerSubscriptionsApi';
import { SeriesDataTypes } from '@rbx/analytics-ui';
import {
  PurchasePlatform,
  PurchasePlatformLabelTranslationKeys,
} from '../enums/PurchasePlatformOption';
import {
  SubscriptionType,
  SubscriptionTypeLabelTranslationKeys,
} from '../enums/SubscriptionTypeOption';
import {
  ExperienceSubscriptionsChartKey,
  ExperienceSubscriptionsChartSpec,
} from '../types/ExperienceSubscriptionsChartSpec';

type BreakdownSpec<RAQIDimension> = Array<RAQIBreakdownValue<RAQIDimension>>;

// TODO (@cigwegbu, 11/06/2023):  https://roblox.atlassian.net/browse/SUBS-2256
const getMetricNameFromChartKey = (
  chartKey: ExperienceSubscriptionsChartKey,
  translate: TranslationKeyToFormattedText,
): FormattedText => {
  switch (chartKey) {
    case ExperienceSubscriptionsChartKey.Sales:
    case ExperienceSubscriptionsChartKey.SalesByProduct:
    case ExperienceSubscriptionsChartKey.SalesBySubscriptionType:
    case ExperienceSubscriptionsChartKey.SalesByPlatform:
      return translate(
        translationKey('Heading.Subscriptions', TranslationNamespace.ExperienceSubscriptions),
      );
    case ExperienceSubscriptionsChartKey.Revenue:
    case ExperienceSubscriptionsChartKey.RevenueByProduct:
    case ExperienceSubscriptionsChartKey.RevenueByPlatform:
      return translate(
        translationKey('Title.Revenue', TranslationNamespace.ExperienceSubscriptions),
      );
    case ExperienceSubscriptionsChartKey.CancellationsBySubscriptionType:
      return translate(
        translationKey(
          'Title.CancellationsBySubscriptionType',
          TranslationNamespace.ExperienceSubscriptions,
        ),
      );
    default: {
      const exhaustiveCheck: never = chartKey;
      throw new Error(`Unrecognized chartKey ${exhaustiveCheck}.`);
    }
  }
};

const BreakdownUnknown = 'Label.Unknown';
const getFormattedTextFromBreakdown = (
  breakdownSpec: BreakdownSpec<DeveloperSubscriptionsAnalyticsDimension>,
  translate: TranslationKeyToFormattedText,
): FormattedText => {
  if (!breakdownSpec.length) {
    return translate(translationKey('Label.Total', TranslationNamespace.ExperienceSubscriptions));
  }

  if (breakdownSpec.length > 1) {
    logAnalyticsError('Multiple breakdowns not supported in experience subscriptions charts.');
    return translate(
      translationKey(BreakdownUnknown, TranslationNamespace.ExperienceSubscriptions),
    );
  }

  const [{ dimension, value }] = breakdownSpec;
  switch (dimension) {
    case DeveloperSubscriptionsAnalyticsDimension.SubscriptionType: {
      const definedKey = SubscriptionTypeLabelTranslationKeys[value as SubscriptionType];
      return translate(
        definedKey ||
          translationKey(BreakdownUnknown, TranslationNamespace.ExperienceSubscriptions),
      );
    }
    case DeveloperSubscriptionsAnalyticsDimension.PurchasePlatform: {
      const definedKey = PurchasePlatformLabelTranslationKeys[value as PurchasePlatform];
      return translate(
        definedKey ||
          translationKey(BreakdownUnknown, TranslationNamespace.ExperienceSubscriptions),
      );
    }
    case DeveloperSubscriptionsAnalyticsDimension.DeveloperSubscriptionProduct: {
      return value as FormattedText;
    }
    case DeveloperSubscriptionsAnalyticsDimension.Invalid: {
      return translate(
        translationKey(BreakdownUnknown, TranslationNamespace.ExperienceSubscriptions),
      );
    }
    default: {
      const exhaustiveCheck: never = dimension;
      throw new Error(`Unrecognized dimension ${exhaustiveCheck}.`);
    }
  }
};

const SalesBySubscriptionTypeChartLegendTooltipTranslationKeys: Record<
  SubscriptionType,
  TranslationKey
> = {
  FirstTime: translationKey(
    'Description.FirstTimePurchase',
    TranslationNamespace.ExperienceSubscriptions,
  ),
  Renewal: translationKey(
    'Description.RenewalPurchase',
    TranslationNamespace.ExperienceSubscriptions,
  ),
  Resurrection: translationKey(
    'Description.ResurrectionPurchase',
    TranslationNamespace.ExperienceSubscriptions,
  ),
};

const CancellationsBySubscriptionTypeChartLegendTooltipTranslationKeys: Record<
  SubscriptionType,
  TranslationKey
> = {
  FirstTime: translationKey(
    'Description.FirstTimePurchaseCancellation',
    TranslationNamespace.ExperienceSubscriptions,
  ),
  Renewal: translationKey(
    'Description.RenewalPurchaseCancellation',
    TranslationNamespace.ExperienceSubscriptions,
  ),
  Resurrection: translationKey(
    'Description.ResurrectionPurchaseCancellation',
    TranslationNamespace.ExperienceSubscriptions,
  ),
};

const SalesByPlatformChartLegendTooltipTranslationKeys: Record<PurchasePlatform, TranslationKey> = {
  Desktop: translationKey(
    'Description.DesktopPurchase',
    TranslationNamespace.ExperienceSubscriptions,
  ),
  Apple: translationKey('Description.ApplePurchase', TranslationNamespace.ExperienceSubscriptions),
  Google: translationKey(
    'Description.GooglePurchase',
    TranslationNamespace.ExperienceSubscriptions,
  ),
  RobloxCredit: translationKey(
    'Description.RobloxCreditPurchase',
    TranslationNamespace.ExperienceSubscriptions,
  ),
  Robux: translationKey('Description.RobuxPurchase', TranslationNamespace.ExperienceSubscriptions),
};

const RevenueByPlatformChartLegendTooltipTranslationKeys: Record<PurchasePlatform, TranslationKey> =
  {
    Desktop: translationKey(
      'Description.DesktopRevenue',
      TranslationNamespace.ExperienceSubscriptions,
    ),
    Apple: translationKey('Description.AppleRevenue', TranslationNamespace.ExperienceSubscriptions),
    Google: translationKey(
      'Description.GoogleRevenue',
      TranslationNamespace.ExperienceSubscriptions,
    ),
    RobloxCredit: translationKey(
      'Description.RobloxCreditRevenue',
      TranslationNamespace.ExperienceSubscriptions,
    ),
    Robux: translationKey('Description.RobuxRevenue', TranslationNamespace.ExperienceSubscriptions),
  };

const getSeriesTooltipKey = (
  chartKey: ExperienceSubscriptionsChartKey,
  breakdownSpec: BreakdownSpec<DeveloperSubscriptionsAnalyticsDimension>,
): TranslationKey | undefined => {
  if (!breakdownSpec.length) {
    return undefined;
  }

  if (breakdownSpec.length > 1) {
    throw new Error('Multiple breakdowns not supported.');
  }

  const [{ value }] = breakdownSpec;

  switch (chartKey) {
    case ExperienceSubscriptionsChartKey.SalesBySubscriptionType:
      return SalesBySubscriptionTypeChartLegendTooltipTranslationKeys[value as SubscriptionType];
    case ExperienceSubscriptionsChartKey.CancellationsBySubscriptionType:
      return CancellationsBySubscriptionTypeChartLegendTooltipTranslationKeys[
        value as SubscriptionType
      ];
    case ExperienceSubscriptionsChartKey.SalesByPlatform:
      return SalesByPlatformChartLegendTooltipTranslationKeys[value as PurchasePlatform];
    case ExperienceSubscriptionsChartKey.RevenueByPlatform:
      return RevenueByPlatformChartLegendTooltipTranslationKeys[value as PurchasePlatform];
    case ExperienceSubscriptionsChartKey.Sales:
    case ExperienceSubscriptionsChartKey.Revenue:
    case ExperienceSubscriptionsChartKey.SalesByProduct:
    case ExperienceSubscriptionsChartKey.RevenueByProduct:
      return undefined;
    default: {
      const exhaustiveCheck: never = chartKey;
      throw new Error(`Unrecognized chartKey ${exhaustiveCheck}.`);
    }
  }
};

const chartKeyToChartUnit: Record<ExperienceSubscriptionsChartKey, ChartUnit> = {
  [ExperienceSubscriptionsChartKey.Sales]: ChartUnit.Sales,
  [ExperienceSubscriptionsChartKey.SalesByProduct]: ChartUnit.Sales,
  [ExperienceSubscriptionsChartKey.SalesByPlatform]: ChartUnit.Sales,
  [ExperienceSubscriptionsChartKey.SalesBySubscriptionType]: ChartUnit.Sales,
  [ExperienceSubscriptionsChartKey.Revenue]: ChartUnit.Robux,
  [ExperienceSubscriptionsChartKey.RevenueByProduct]: ChartUnit.Robux,
  [ExperienceSubscriptionsChartKey.RevenueByPlatform]: ChartUnit.Robux,
  [ExperienceSubscriptionsChartKey.CancellationsBySubscriptionType]: ChartUnit.Cancellations,
};

const chartUnitAggregationType = ChartUnitAggregationType.SummaryTotal;

const formatSummary = (
  seriesInfo: SortedSeriesInfo<BreakdownSpec<DeveloperSubscriptionsAnalyticsDimension>>,
  sortedTimestamps: Array<Timestamp>,
  chartKey: ExperienceSubscriptionsChartKey,
): Array<NumericChartSummaryItemSpec> => {
  if (!sortedTimestamps.length) {
    return [];
  }

  switch (chartKey) {
    case ExperienceSubscriptionsChartKey.Sales:
    case ExperienceSubscriptionsChartKey.Revenue:
    case ExperienceSubscriptionsChartKey.SalesByProduct:
    case ExperienceSubscriptionsChartKey.RevenueByProduct:
      return [
        {
          summaryValueType: SummaryValueType.Numeric,
          unit: chartKeyToChartUnit[chartKey],
          type: chartUnitAggregationType,
          value: totalDatapointsAcrossSeries(seriesInfo),
          correspondingBreakdowns: [],
        },
      ];
    case ExperienceSubscriptionsChartKey.SalesByPlatform:
      return seriesInfo.map((singleSeriesInfo) => ({
        summaryValueType: SummaryValueType.Numeric,
        unit: chartKeyToChartUnit[chartKey],
        type: chartUnitAggregationType,
        value: totalDatapointsAcrossSeries([singleSeriesInfo]),
        specificLabel: singleSeriesInfo.summaryLabel,
        tooltipKey: getSeriesTooltipKey(
          ExperienceSubscriptionsChartKey.SalesByPlatform,
          singleSeriesInfo.seriesId,
        ),
        correspondingBreakdowns: [],
      }));
    case ExperienceSubscriptionsChartKey.RevenueByPlatform:
      return seriesInfo.map((singleSeriesInfo) => ({
        summaryValueType: SummaryValueType.Numeric,
        unit: chartKeyToChartUnit[chartKey],
        type: chartUnitAggregationType,
        value: totalDatapointsAcrossSeries([singleSeriesInfo]),
        specificLabel: singleSeriesInfo.summaryLabel,
        tooltipKey: getSeriesTooltipKey(
          ExperienceSubscriptionsChartKey.RevenueByPlatform,
          singleSeriesInfo.seriesId,
        ),
        correspondingBreakdowns: [],
      }));
    case ExperienceSubscriptionsChartKey.SalesBySubscriptionType:
      return seriesInfo.map((singleSeriesInfo) => ({
        summaryValueType: SummaryValueType.Numeric,
        unit: chartKeyToChartUnit[chartKey],
        type: chartUnitAggregationType,
        value: totalDatapointsAcrossSeries([singleSeriesInfo]),
        specificLabel: singleSeriesInfo.summaryLabel,
        tooltipKey: getSeriesTooltipKey(
          ExperienceSubscriptionsChartKey.SalesBySubscriptionType,
          singleSeriesInfo.seriesId,
        ),
        correspondingBreakdowns: [],
      }));
    case ExperienceSubscriptionsChartKey.CancellationsBySubscriptionType:
      return seriesInfo.map((singleSeriesInfo) => ({
        summaryValueType: SummaryValueType.Numeric,
        unit: chartKeyToChartUnit[chartKey],
        type: chartUnitAggregationType,
        value: totalDatapointsAcrossSeries([singleSeriesInfo]),
        specificLabel: singleSeriesInfo.summaryLabel,
        tooltipKey: getSeriesTooltipKey(
          ExperienceSubscriptionsChartKey.CancellationsBySubscriptionType,
          singleSeriesInfo.seriesId,
        ),
        correspondingBreakdowns: [],
      }));
    default: {
      const exhaustiveCheck: never = chartKey;
      throw new Error(`Unrecognized chartKey ${exhaustiveCheck}.`);
    }
  }
};

const experienceSubscriptionsChartAdapters = (
  response: RAQIResponse<DeveloperSubscriptionsAnalyticsDimension> | null,
  translate: TranslationKeyToFormattedText,
  locale: Locale,
  spec: ExperienceSubscriptionsChartSpec,
): {
  chart: TimeSeriesSplineChartSpec;
  summary: Array<NumericChartSummaryItemSpec>;
} => {
  const { endDate, chartKey } = spec;
  const seriesIntervalMeaning = DailyTimeSeriesAlignedToUTCMidnight;

  const allSeries: Array<RAQIMetricValue<DeveloperSubscriptionsAnalyticsDimension>> =
    response?.values ?? [];
  const { allTimestamps, pointsBySeries } = ingestRAQIMetricValues(allSeries);
  const sortedTimestamps = processTimestamps(allTimestamps, seriesIntervalMeaning, endDate);

  const nameFn = (breakdownSpec: BreakdownSpec<DeveloperSubscriptionsAnalyticsDimension>) =>
    getFormattedTextFromBreakdown(breakdownSpec, translate);

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

  const summary: Array<NumericChartSummaryItemSpec> = formatSummary(
    seriesInfo,
    sortedTimestamps,
    chartKey,
  );

  return {
    chart: {
      unit: {
        unit: chartKeyToChartUnit[chartKey],
        display: getMetricNameFromChartKey(chartKey, translate),
        type: chartUnitAggregationType,
      },
      timestamps: sortedTimestamps,
      series: seriesInfo.map(({ data, legendName }) => ({
        name: legendName,
        dataPoints: data,
        type: SeriesDataTypes.Normal,
        zones: [],
      })),
    },
    summary,
  };
};

export default experienceSubscriptionsChartAdapters;
