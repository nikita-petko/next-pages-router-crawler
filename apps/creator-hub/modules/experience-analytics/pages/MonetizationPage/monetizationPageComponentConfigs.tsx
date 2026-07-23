import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { useFlag } from '@rbx/flags';
import { showDevExO18LandingPage } from '@generated/flags/creatorBusiness';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { getCurrentDate, subHours } from '@modules/charts-generic/utils/dateUtils';
import MonetizationBreakglassBanner from '@modules/experience-analytics-shared/components/Banners/MonetizationBreakglassBanner';
import AnalyticsConfigChart from '@modules/experience-analytics-shared/components/RAQIV2/AnalyticsConfigChart';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import GenericAnalyticsLayoutItem from '@modules/experience-analytics-shared/components/RAQIV2/layout/GenericAnalyticsLayoutItem';
import {
  chartConfigAverageRevenuePerDailyActiveUser,
  chartConfigAverageRevenuePerPayingUser,
  chartConfigDailyRevenue,
  chartConfigDailyRevenueBySource,
} from '@modules/experience-analytics-shared/constants/chart-configs/PredefinedChartConfigLiterals';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import RAQIV2PredefinedChartKey from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartKey';
import { RAQIV2SummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import DevExO18PromotionBanner from '@modules/experience-monetization/components/DevExO18PromotionBanner/DevExO18PromotionBanner';
import useDevExO18EligibilityState from '@modules/experience-monetization/hooks/useDevExO18EligibilityState';
import ManagedPricingPromotionBanner from '@modules/managed-pricing/banners/ManagedPricingPromotionBanner';
import { useIsManagedPricingPromotionBannerShown } from '@modules/managed-pricing/banners/useManagedPricingPromotionBanner';
import { useIsManagedPricingAvailable } from '@modules/managed-pricing/hooks/useIsManagedPricingAvailable';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import PersonalizedShopPromotionBanner from '@modules/shops/banners/PersonalizedShopPromotionBanner';
import { useIsPersonalizedShopPromotionBannerShown } from '@modules/shops/banners/usePersonalizedShopPromotionBanner';
import MonetizationSubpageDiscoveryCards from './components/MonetizationSubpageDiscoveryCards';

export const chartConfigHourlyRevenueBySource = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.HourlySales', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.RobuxHourly', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.ItemMonetizationRevenue,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.ProductType],
    },
    granularity: { override: RAQIV2MetricGranularity.OneHour },
    filter: {
      override: [], // cannot filter the realtime revenue
    },
  },
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    aggregatedBreakdownSummaryTypes: [],
  },
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

/**
 * Page-specific title overrides for the Monetization Overview page only.
 *
 * The base predefined chart configs (Daily Revenue, Daily Revenue By Source,
 * ARPPU, ARPU) are shared across multiple analytics pages, so we wrap each
 * one here with overridden `titleKey` / `titleKeyByGranularity` instead of
 * mutating the shared configs. Tooltip keys and all other behavior are
 * preserved by spreading the base config.
 */
export const chartConfigMonetizationDailyRevenue = {
  ...chartConfigDailyRevenue,
  titleKey: translationKey('Title.DailySales', TranslationNamespace.Analytics),
  titleKeyByGranularity: {
    [RAQIV2MetricGranularity.OneWeek]: translationKey(
      'Title.WeeklySales',
      TranslationNamespace.Analytics,
    ),
    [RAQIV2MetricGranularity.OneMonth]: translationKey(
      'Title.MonthlySales',
      TranslationNamespace.Analytics,
    ),
  },
} satisfies ChartConfig;

export const chartConfigMonetizationDailyRevenueBySource = {
  ...chartConfigDailyRevenueBySource,
  titleKey: translationKey('Title.SaleSources', TranslationNamespace.Analytics),
} satisfies ChartConfig;

export const chartConfigMonetizationDailyRevenueByBalanceType = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.DailyRevenueByBalanceType,
  titleKey: translationKey('Title.DailyRevenueByBalanceType', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.DailyRevenueByBalanceType',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.DailyRevenue,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.BalanceType],
    },
  },
  chartType: ChartType.Column,
  hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative: true,
  summarySpec: {
    totalSummaryTypes: [],
    perBreakdownSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigMonetizationAverageRevenuePerPayingUser = {
  ...chartConfigAverageRevenuePerPayingUser,
  titleKey: translationKey('Title.AverageSalesPerPayingUser', TranslationNamespace.Analytics),
} satisfies ChartConfig;

export const chartConfigMonetizationAverageRevenuePerDailyActiveUser = {
  ...chartConfigAverageRevenuePerDailyActiveUser,
  titleKey: translationKey('Title.AverageSalesPerUser', TranslationNamespace.Analytics),
  titleKeyByGranularity: {
    [RAQIV2MetricGranularity.OneWeek]: translationKey(
      'Title.AverageSalesPerUser.Weekly',
      TranslationNamespace.Analytics,
    ),
    [RAQIV2MetricGranularity.OneMonth]: translationKey(
      'Title.AverageSalesPerUser.Monthly',
      TranslationNamespace.Analytics,
    ),
  },
} satisfies ChartConfig;

export const arbitraryComponentConfigMonetizationHourlyChart = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [RAQIV2Metric.ItemMonetizationRevenue],
  renderer: {
    type: 'withChartContext',
    render: (chartContext, onSelectChartRegion) => {
      // Handle MonetizationHourlyChart
      // TODO(gperkins@20240708): DSA-2650 -- Add date range override to chartSpec, remove non-generic component
      const endTime = getCurrentDate();
      const startTime = subHours(endTime, 72);

      const hourlyContext: RAQIV2ChartContext = {
        ...chartContext,
        timeSpec: { rangeType: RAQIV2DateRangeType.Custom, startTime, endTime },
        timeAxisBounds: [startTime, endTime],
      };

      return (
        <GenericAnalyticsLayoutItem layout={RAQIV2SpecialLayoutType.FullWidthLayout}>
          <AnalyticsConfigChart
            chartKeyOrConfig={chartConfigHourlyRevenueBySource}
            chartContext={hourlyContext}
            onSelectChartRegion={onSelectChartRegion}
          />
        </GenericAnalyticsLayoutItem>
      );
    },
  },
} as const satisfies ArbitraryComponentConfig;

export const arbitraryComponentConfigPersonalizedShopPromotionBanner = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: function PersonalizedShopPromotionBannerRenderer() {
      const { universeId = 0 } = useUniverseId();
      const isPersonalizedShopBannerShown = useIsPersonalizedShopPromotionBannerShown(universeId);

      if (!isPersonalizedShopBannerShown) {
        return null;
      }

      return (
        <PersonalizedShopPromotionBanner universeId={universeId} className='margin-bottom-medium' />
      );
    },
  },
} as const satisfies ArbitraryComponentConfig;

export const arbitraryComponentConfigMonetizationFeaturePromotionBanner = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: function MonetizationFeaturePromotionBanner() {
      const { universeId = 0 } = useUniverseId();
      const { data: isManagedPricingAvailable } = useIsManagedPricingAvailable(universeId);
      const isPersonalizedShopBannerShown = useIsPersonalizedShopPromotionBannerShown(universeId);

      if (isManagedPricingAvailable === undefined) {
        return null;
      }

      if (isManagedPricingAvailable) {
        return (
          <ManagedPricingPromotionBanner
            universeId={universeId}
            page='monetization/overview'
            emphasizePrimaryButton={isPersonalizedShopBannerShown === false}
            className='margin-bottom-medium'
          />
        );
      }

      return null;
    },
  },
} as const satisfies ArbitraryComponentConfig;

export const arbitraryComponentConfigDevExO18PromotionBanner = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'withChartContext',
    render: function DevExO18PromotionBannerRenderer() {
      const { universeId = 0 } = useUniverseId();
      const { value: showDevExO18 } = useFlag(showDevExO18LandingPage);
      const { o18Eligibility } = useDevExO18EligibilityState(universeId, {
        enabled: showDevExO18 === true,
      });
      const isPersonalizedShopBannerShown = useIsPersonalizedShopPromotionBannerShown(universeId);
      const isManagedPricingBannerShown = useIsManagedPricingPromotionBannerShown(
        universeId,
        'monetization/overview',
      );

      // Only surface this banner if the shop or the managed-pricing banner is no longer taking the slot
      if (
        !showDevExO18 ||
        !Number.isFinite(universeId) ||
        (isPersonalizedShopBannerShown !== false && isManagedPricingBannerShown !== false)
      ) {
        return null;
      }

      return (
        <DevExO18PromotionBanner
          universeId={universeId}
          o18EligibilityState={o18Eligibility}
          className='margin-bottom-medium'
        />
      );
    },
  },
} as const satisfies ArbitraryComponentConfig;

export const arbitraryComponentConfigMonetizationSubpageSummaryCards = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: () => {
      return <MonetizationSubpageDiscoveryCards />;
    },
  },
} as const satisfies ArbitraryComponentConfig;

export const arbitraryComponentConfigMonetizationBreakglassBanner = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: () => {
      return <MonetizationBreakglassBanner />;
    },
  },
} as const satisfies ArbitraryComponentConfig;
