import { SeriesDataTypes } from '@rbx/analytics-ui';
import { DeveloperSubscriptionsAnalyticsDimension } from '@rbx/client-developer-subscriptions-api/v1';
import type { Locale } from '@rbx/intl';
import type {
  TranslationKey,
  FormattedText,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations/types';
import {
  brandUntranslatableText,
  translationKey,
} from '@modules/analytics-translations/wrapperFunctions';
import type { SortedSeriesInfo } from '@modules/charts-generic/adapters/genericRAQIChartAdapter';
import {
  ingestRAQIMetricValues,
  processTimestamps,
  sortTotalBreakdownFirst,
  totalDatapointsAcrossSeries,
  buildSeriesInfo,
  InfillBehavior,
} from '@modules/charts-generic/adapters/genericRAQIChartAdapter';
import type { NumericChartSummaryItemSpec } from '@modules/charts-generic/charts/ChartSummaryItem';
import { SummaryValueType } from '@modules/charts-generic/charts/ChartSummaryItem';
import type { TFormattingSpec } from '@modules/charts-generic/charts/numberFormatters';
import type { TimeSeriesSplineChartSpec } from '@modules/charts-generic/charts/types/TimeSeriesSplineChartTypes';
import type { Timestamp } from '@modules/charts-generic/charts/types/TimeSeriesTypes';
import {
  integerFormattingSpec,
  robuxFormattingSpec,
} from '@modules/charts-generic/constants/analyticsNumberFormattingSpec';
import ChartSummaryType from '@modules/charts-generic/enums/ChartSummaryType';
import { DailyTimeSeriesAlignedToUTCMidnight } from '@modules/charts-generic/enums/SeriesIntervalMeaning';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import type { RAQIBreakdownValue, RAQIMetricValue, RAQIResponse } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  PurchasePlatform,
  PurchasePlatformLabelTranslationKeys,
} from '../enums/PurchasePlatformOption';
import {
  SubscriptionType,
  SubscriptionTypeLabelTranslationKeys,
} from '../enums/SubscriptionTypeOption';
import type { ExperienceSubscriptionsChartSpec } from '../types/ExperienceSubscriptionsChartSpec';
import { ExperienceSubscriptionsChartKey } from '../types/ExperienceSubscriptionsChartSpec';

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
      throw new Error(`Unrecognized chartKey ${String(exhaustiveCheck)}.`);
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
      const definedKey = isValidEnumValue(SubscriptionType, value)
        ? SubscriptionTypeLabelTranslationKeys[value]
        : undefined;
      return translate(
        definedKey ??
          translationKey(BreakdownUnknown, TranslationNamespace.ExperienceSubscriptions),
      );
    }
    case DeveloperSubscriptionsAnalyticsDimension.PurchasePlatform: {
      const definedKey = isValidEnumValue(PurchasePlatform, value)
        ? PurchasePlatformLabelTranslationKeys[value]
        : undefined;
      return translate(
        definedKey ??
          translationKey(BreakdownUnknown, TranslationNamespace.ExperienceSubscriptions),
      );
    }
    case DeveloperSubscriptionsAnalyticsDimension.DeveloperSubscriptionProduct: {
      return brandUntranslatableText(value);
    }
    case DeveloperSubscriptionsAnalyticsDimension.Invalid: {
      return translate(
        translationKey(BreakdownUnknown, TranslationNamespace.ExperienceSubscriptions),
      );
    }
    default: {
      const exhaustiveCheck: never = dimension;
      throw new Error(`Unrecognized dimension ${String(exhaustiveCheck)}.`);
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
      return isValidEnumValue(SubscriptionType, value)
        ? SalesBySubscriptionTypeChartLegendTooltipTranslationKeys[value]
        : undefined;
    case ExperienceSubscriptionsChartKey.CancellationsBySubscriptionType:
      return isValidEnumValue(SubscriptionType, value)
        ? CancellationsBySubscriptionTypeChartLegendTooltipTranslationKeys[value]
        : undefined;
    case ExperienceSubscriptionsChartKey.SalesByPlatform:
      return isValidEnumValue(PurchasePlatform, value)
        ? SalesByPlatformChartLegendTooltipTranslationKeys[value]
        : undefined;
    case ExperienceSubscriptionsChartKey.RevenueByPlatform:
      return isValidEnumValue(PurchasePlatform, value)
        ? RevenueByPlatformChartLegendTooltipTranslationKeys[value]
        : undefined;
    case ExperienceSubscriptionsChartKey.Sales:
    case ExperienceSubscriptionsChartKey.Revenue:
    case ExperienceSubscriptionsChartKey.SalesByProduct:
    case ExperienceSubscriptionsChartKey.RevenueByProduct:
      return undefined;
    default: {
      const exhaustiveCheck: never = chartKey;
      throw new Error(`Unrecognized chartKey ${String(exhaustiveCheck)}.`);
    }
  }
};

const chartKeyToFormattingSpec: Record<ExperienceSubscriptionsChartKey, TFormattingSpec> = {
  [ExperienceSubscriptionsChartKey.Sales]: integerFormattingSpec,
  [ExperienceSubscriptionsChartKey.SalesByProduct]: integerFormattingSpec,
  [ExperienceSubscriptionsChartKey.SalesByPlatform]: integerFormattingSpec,
  [ExperienceSubscriptionsChartKey.SalesBySubscriptionType]: integerFormattingSpec,
  [ExperienceSubscriptionsChartKey.Revenue]: robuxFormattingSpec,
  [ExperienceSubscriptionsChartKey.RevenueByProduct]: robuxFormattingSpec,
  [ExperienceSubscriptionsChartKey.RevenueByPlatform]: robuxFormattingSpec,
  [ExperienceSubscriptionsChartKey.CancellationsBySubscriptionType]: integerFormattingSpec,
};

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
          summaryType: ChartSummaryType.Total,
          formattingSpec: chartKeyToFormattingSpec[chartKey],
          value: totalDatapointsAcrossSeries(seriesInfo),
          correspondingBreakdowns: [],
        },
      ];
    case ExperienceSubscriptionsChartKey.SalesByPlatform:
      return seriesInfo.map((singleSeriesInfo) => ({
        summaryValueType: SummaryValueType.Numeric as const,
        summaryType: ChartSummaryType.Total as const,
        formattingSpec: chartKeyToFormattingSpec[chartKey],
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
        summaryValueType: SummaryValueType.Numeric as const,
        summaryType: ChartSummaryType.Total as const,
        formattingSpec: chartKeyToFormattingSpec[chartKey],
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
        summaryValueType: SummaryValueType.Numeric as const,
        summaryType: ChartSummaryType.Total as const,
        formattingSpec: chartKeyToFormattingSpec[chartKey],
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
        summaryValueType: SummaryValueType.Numeric as const,
        summaryType: ChartSummaryType.Total as const,
        formattingSpec: chartKeyToFormattingSpec[chartKey],
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
      throw new Error(`Unrecognized chartKey ${String(exhaustiveCheck)}.`);
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

  const seriesInfo = buildSeriesInfo<BreakdownSpec<DeveloperSubscriptionsAnalyticsDimension>>({
    pointsBySeries,
    sortedTimestamps,
    granularity: seriesIntervalMeaning,
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
        display: getMetricNameFromChartKey(chartKey, translate),
        formattingSpec: chartKeyToFormattingSpec[chartKey],
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
