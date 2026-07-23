import React, { useMemo } from 'react';

import { DateRangeType, AnalyticsDocLink } from '@modules/charts-generic';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { translationKey } from '@modules/analytics-translations';
import {
  RAQIV2UIPseudoDimension,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  RAQIV2PredefinedChartKey,
  CreatorAnalyticsUntabbedPageConfig,
  CreatorAnalyticsLayout,
  CreatorAnalyticsPageMode,
  RAQIV2SpecialLayoutType,
  useIsMonetizationBreakglassBannerOn,
  EndDateBehavior,
  USER_SEGMENTATION_DIMENSIONS,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  arbitraryComponentConfigMonetizationHourlyChart,
  arbitraryComponentConfigRegionalPricingBanner,
  arbitraryComponentConfigMonetizationSubpageSummaryCards,
  arbitraryComponentConfigMonetizationBreakglassBanner,
} from './monetizationPageComponentConfigs';

const monetizationDocLink: AnalyticsDocLink = '/docs/production/analytics/monetization';

const monetizationTimeRangeOptions = {
  type: 'dateRange',
  supportedRanges: [
    DateRangeType.Last7Days,
    DateRangeType.Last28Days,
    DateRangeType.Last56Days,
    DateRangeType.Last90Days,
    DateRangeType.Last365Days,
    DateRangeType.Custom,
  ],
  defaultRange: DateRangeType.Last28Days,
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
  const isMonetizationBreakglassBannerOn = useIsMonetizationBreakglassBannerOn();
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
          RAQIV2Dimension.AgeGroup,
          RAQIV2Dimension.Platform,
          RAQIV2Dimension.OperatingSystem,
          RAQIV2Dimension.Gender,
          RAQIV2UIPseudoDimension.TopCountries,
          RAQIV2UIPseudoDimension.TopLocales,
          ...USER_SEGMENTATION_DIMENSIONS,
        ],
        breakdownDimensions: [
          RAQIV2Dimension.AgeGroup,
          RAQIV2Dimension.Platform,
          RAQIV2Dimension.OperatingSystem,
          RAQIV2Dimension.Gender,
          RAQIV2UIPseudoDimension.TopCountries,
          RAQIV2UIPseudoDimension.TopLocales,
          ...USER_SEGMENTATION_DIMENSIONS,
        ],
        body: [
          RAQIV2PredefinedChartKey.DailyRevenue,
          RAQIV2PredefinedChartKey.DailyRevenueBySource,
          RAQIV2PredefinedChartKey.ConversionRate,
          RAQIV2PredefinedChartKey.PayingUsers,
          RAQIV2PredefinedChartKey.AverageRevenuePerPayingUser,
          RAQIV2PredefinedChartKey.AverageRevenuePerDailyActiveUser,
        ],
        preControlCharts: [
          // Promo announcement banner for regional pricing
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [arbitraryComponentConfigRegionalPricingBanner],
            stylingOverride: {
              marginBottom: 3,
            },
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
    [],
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
