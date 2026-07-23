import { useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import { useFlag } from '@rbx/flags';
import { isDailyRevenueByBalanceTypeChartEnabled as isDailyRevenueByBalanceTypeChartFlag } from '@generated/flags/creatorBusiness';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { O18Eligibility } from '@modules/clients/creatorDevexApi';
import { useIsMonetizationBreakglassBannerOn } from '@modules/experience-analytics-shared/components/Banners/MonetizationBreakglassBanner';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import RAQIV2PredefinedChartKey from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartKey';
import USER_SEGMENTATION_DIMENSIONS from '@modules/experience-analytics-shared/constants/UserSegmentationDimensions';
import {
  CreatorAnalyticsPageMode,
  EndDateBehavior,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsUntabbedPageConfig,
  RAQIV2UIComponent,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import useDevExO18EligibilityState from '@modules/experience-monetization/hooks/useDevExO18EligibilityState';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  arbitraryComponentConfigDevExO18PromotionBanner,
  arbitraryComponentConfigMonetizationHourlyChart,
  arbitraryComponentConfigMonetizationFeaturePromotionBanner,
  arbitraryComponentConfigMonetizationSubpageSummaryCards,
  arbitraryComponentConfigMonetizationBreakglassBanner,
  chartConfigMonetizationAverageRevenuePerDailyActiveUser,
  chartConfigMonetizationAverageRevenuePerPayingUser,
  chartConfigMonetizationDailyRevenue,
  chartConfigMonetizationDailyRevenueBySource,
  chartConfigMonetizationDailyRevenueByBalanceType,
  arbitraryComponentConfigPersonalizedShopPromotionBanner,
} from './monetizationPageComponentConfigs';

const monetizationDocLink: AnalyticsDocLink = '/docs/production/analytics/monetization';

const monetizationTimeRangeOptions = {
  type: 'dateRange',
  supportedRanges: [
    RAQIV2DateRangeType.Last7Days,
    RAQIV2DateRangeType.Last28Days,
    RAQIV2DateRangeType.Last56Days,
    RAQIV2DateRangeType.Last90Days,
    RAQIV2DateRangeType.Custom,
  ],
  defaultRange: RAQIV2DateRangeType.Last28Days,
  excludeEndDateInRange: false,
  maxEndDateOffset: 0,
  maxStartDateOffsetDays: 365 * 2,
  maxRangeDays: 365 * 2 + 1,
} as const satisfies AnalyticsPageConfigDateOptions;

const monetizationSurfaceAnnotationOptions = {
  supportedAnnotationTypes: [
    AnnotationType.PlaceIcon,
    AnnotationType.PlaceThumbnail,
    AnnotationType.PlaceVideo,
    AnnotationType.PlaceVersion,
    AnnotationType.Benchmark,
    AnnotationType.LiveEvent,
    AnnotationType.ConfigVersion,
    AnnotationType.Announcement,
  ],
  defaultAnnotationTypes: [AnnotationType.Benchmark],
  showAnnotationsControl: true,
} as const satisfies AnalyticsPageConfigAnnotationOptions;
const MonetizationPageRAQIV2 = () => {
  const { value: isDailyRevenueByBalanceTypeChartEnabled } = useFlag(
    isDailyRevenueByBalanceTypeChartFlag,
  );
  const isMonetizationBreakglassBannerOn = useIsMonetizationBreakglassBannerOn();
  const universeId = Number(useRouter().query.id);
  const { o18Eligibility } = useDevExO18EligibilityState(universeId, {
    enabled: isDailyRevenueByBalanceTypeChartEnabled === true,
  });
  const monetizationPageConfig = useMemo(
    (): CreatorAnalyticsUntabbedPageConfig =>
      ({
        mode: CreatorAnalyticsPageMode.Untabbed,
        debugPageName: 'Monetization',
        docLinks: [monetizationDocLink],
        resourceTypes: [RAQIV2ChartResourceType.Universe],
        title: translationKey('Heading.Monetization', TranslationNamespace.Analytics),
        description: {
          standard: translationKey(
            'Description.TakeActionMonetizationExploreCards',
            TranslationNamespace.Analytics,
          ),
          tooltipText: translationKey(
            'Description.MonetizationDisclaimer',
            TranslationNamespace.Analytics,
          ),
        },
        timeRangeOptions: monetizationTimeRangeOptions,
        surfaceAnnotationOptions: monetizationSurfaceAnnotationOptions,
        granularity: {
          options: [
            RAQIV2MetricGranularity.OneDay,
            RAQIV2MetricGranularity.OneWeek,
            RAQIV2MetricGranularity.OneMonth,
          ],
        },
        filterDimensions: [
          RAQIV2Dimension.AgeGroupV2,
          RAQIV2Dimension.Platform,
          RAQIV2Dimension.OperatingSystem,
          RAQIV2Dimension.Gender,
          RAQIV2UIPseudoDimension.TopCountries,
          RAQIV2UIPseudoDimension.TopLocales,
          ...USER_SEGMENTATION_DIMENSIONS,
          RAQIV2Dimension.UserO18Eligibility,
        ],
        breakdownDimensions: [
          RAQIV2Dimension.AgeGroupV2,
          RAQIV2Dimension.Platform,
          RAQIV2Dimension.OperatingSystem,
          RAQIV2Dimension.Gender,
          RAQIV2UIPseudoDimension.TopCountries,
          RAQIV2UIPseudoDimension.TopLocales,
          ...USER_SEGMENTATION_DIMENSIONS,
          RAQIV2Dimension.UserO18Eligibility,
        ],
        body: [
          ...(isDailyRevenueByBalanceTypeChartEnabled && o18Eligibility === O18Eligibility.Eligible
            ? ([
                {
                  type: RAQIV2SpecialLayoutType.FullWidthLayout,
                  items: [chartConfigMonetizationDailyRevenue],
                },
                chartConfigMonetizationDailyRevenueBySource,
                chartConfigMonetizationDailyRevenueByBalanceType,
              ] satisfies RAQIV2UIComponent[])
            : [chartConfigMonetizationDailyRevenue, chartConfigMonetizationDailyRevenueBySource]),
          RAQIV2PredefinedChartKey.ConversionRate,
          RAQIV2PredefinedChartKey.PayingUsers,
          chartConfigMonetizationAverageRevenuePerPayingUser,
          chartConfigMonetizationAverageRevenuePerDailyActiveUser,
        ],
        preControlCharts: [
          // Promo announcement banner for monetization features
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [arbitraryComponentConfigPersonalizedShopPromotionBanner],
          },
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [arbitraryComponentConfigMonetizationFeaturePromotionBanner],
          },
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [arbitraryComponentConfigDevExO18PromotionBanner],
          },
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [
              arbitraryComponentConfigMonetizationSubpageSummaryCards,
              arbitraryComponentConfigMonetizationHourlyChart,
            ],
            stylingOverride: {
              spacing: 3,
            },
          },
        ],
        hideHeroDivider: false,
        endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
      }) as const,
    [isDailyRevenueByBalanceTypeChartEnabled, o18Eligibility],
  );

  const updatedPageConfig = useMemo(() => {
    let config = monetizationPageConfig;

    if (isMonetizationBreakglassBannerOn) {
      const newPreControlCharts = monetizationPageConfig.preControlCharts
        ? [...monetizationPageConfig.preControlCharts]
        : [];
      newPreControlCharts.unshift({
        type: RAQIV2SpecialLayoutType.FullWidthLayout,
        items: [arbitraryComponentConfigMonetizationBreakglassBanner],
      });
      config = {
        ...monetizationPageConfig,
        preControlCharts: newPreControlCharts,
      };
    }

    return config;
  }, [isMonetizationBreakglassBannerOn, monetizationPageConfig]);

  return <CreatorAnalyticsLayout config={updatedPageConfig} />;
};

export default MonetizationPageRAQIV2;
