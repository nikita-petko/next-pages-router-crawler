import { SeriesDataTypes } from '@rbx/analytics-ui';
import { DeveloperSubscriptionsAnalyticsDimension } from '@rbx/client-developer-subscriptions-api/v1';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { Locale } from '@rbx/intl';
import type {
  TranslationKey,
  FormattedText,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
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
import {
  ChartUnit,
  ChartUnitAggregationType,
} from '@modules/charts-generic/charts/types/ChartTypes';
import type { TimeSeriesSplineChartSpec } from '@modules/charts-generic/charts/types/TimeSeriesSplineChartTypes';
import type { Timestamp } from '@modules/charts-generic/charts/types/TimeSeriesTypes';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import type { RAQIBreakdownValue, RAQIMetricValue, RAQIResponse } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { PurchasePlatform } from '../enums/PurchasePlatformOption';
import { PurchasePlatformLabelTranslationKeys } from '../enums/PurchasePlatformOption';
import type { SubscriptionType } from '../enums/SubscriptionTypeOption';
import { SubscriptionTypeLabelTranslationKeys } from '../enums/SubscriptionTypeOption';
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
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      const definedKey = SubscriptionTypeLabelTranslationKeys[value as SubscriptionType];
      return translate(
        definedKey ||
          translationKey(BreakdownUnknown, TranslationNamespace.ExperienceSubscriptions),
      );
    }
    case DeveloperSubscriptionsAnalyticsDimension.PurchasePlatform: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      const definedKey = PurchasePlatformLabelTranslationKeys[value as PurchasePlatform];
      return translate(
        definedKey ||
          translationKey(BreakdownUnknown, TranslationNamespace.ExperienceSubscriptions),
      );
    }
    case DeveloperSubscriptionsAnalyticsDimension.DeveloperSubscriptionProduct: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      return value as FormattedText;
    }
    case DeveloperSubscriptionsAnalyticsDimension.Invalid: {
      return translate(
        translationKey(BreakdownUnknown, TranslationNamespace.ExperienceSubscriptions),
      );
    }
    default: {
      const exhaustiveCheck: never = dimension;
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      return SalesBySubscriptionTypeChartLegendTooltipTranslationKeys[value as SubscriptionType];
    case ExperienceSubscriptionsChartKey.CancellationsBySubscriptionType:
      return CancellationsBySubscriptionTypeChartLegendTooltipTranslationKeys[
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
        value as SubscriptionType
      ];
    case ExperienceSubscriptionsChartKey.SalesByPlatform:
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      return SalesByPlatformChartLegendTooltipTranslationKeys[value as PurchasePlatform];
    case ExperienceSubscriptionsChartKey.RevenueByPlatform:
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      return RevenueByPlatformChartLegendTooltipTranslationKeys[value as PurchasePlatform];
    case ExperienceSubscriptionsChartKey.Sales:
    case ExperienceSubscriptionsChartKey.Revenue:
    case ExperienceSubscriptionsChartKey.SalesByProduct:
    case ExperienceSubscriptionsChartKey.RevenueByProduct:
      return undefined;
    default: {
      const exhaustiveCheck: never = chartKey;
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
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
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
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
  const granularity = RAQIV2MetricGranularity.OneDay;

  const allSeries: Array<RAQIMetricValue<DeveloperSubscriptionsAnalyticsDimension>> =
    response?.values ?? [];
  const { allTimestamps, pointsBySeries } = ingestRAQIMetricValues(allSeries);
  const sortedTimestamps = processTimestamps(allTimestamps, granularity, endDate);

  const nameFn = (breakdownSpec: BreakdownSpec<DeveloperSubscriptionsAnalyticsDimension>) =>
    getFormattedTextFromBreakdown(breakdownSpec, translate);

  const seriesInfo = buildSeriesInfo({
    pointsBySeries,
    sortedTimestamps,
    granularity,
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
