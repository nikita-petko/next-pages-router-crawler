import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  RAQIV2AvatarItemTargetType,
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { withTranslation } from '@rbx/intl';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import getCreatorAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getCreatorAnalyticsPageLayout';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsUntabbedPageConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { CreatorAnalyticsPageMode } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  chartConfigItemMarketplaceVersusInExperience,
  chartConfigItemPurchasePlatform,
  chartConfigItemPurchaserAge,
  chartConfigItemPurchaserDemographics,
  chartConfigItemPurchaserGender,
  tabbedChartConfigItemRevenueAndSales,
} from './itemAnalyticsChartConfigs';
import { arbitraryComponentConfigPublishingAdvanceMetricsCard } from './itemAnalyticsComponentConfigs';
import { tableConfigItemSalesByExperience } from './itemAnalyticsTableConfigs';
import ItemRestrictedBanner from './ItemRestrictedBanner';

interface ItemAnalyticsContainerProps {
  isBundle?: boolean;
}

const itemAnalyticsDocLink: AnalyticsDocLink = '/docs/production/analytics/item-analytics';

const itemAnalyticsTimeRangeOptions = {
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
  maxStartDateOffsetDays: 365,
} as const satisfies AnalyticsPageConfigDateOptions;

const itemAnalyticsSurfaceAnnotationOptions = {
  supportedAnnotationTypes: [AnnotationType.Announcement],
  defaultAnnotationTypes: [],
  showAnnotationsControl: false,
} as const satisfies AnalyticsPageConfigAnnotationOptions;
const ItemAnalyticsContainer: React.FC<ItemAnalyticsContainerProps> = ({ isBundle = false }) => {
  const router = useRouter();
  const { id } = router.query;
  const contentId = typeof id === 'string' ? id : '';

  const pageConfig = useMemo(
    (): CreatorAnalyticsUntabbedPageConfig => ({
      mode: CreatorAnalyticsPageMode.Untabbed,
      debugPageName: 'ItemAnalytics',
      docLinks: [itemAnalyticsDocLink],
      resourceTypes: [RAQIV2ChartResourceType.User],
      title: translationKey('Heading.ItemAnalytics', TranslationNamespace.Analytics),
      description: {
        standard: translationKey('Description.ItemAnalytics', TranslationNamespace.Analytics),
      },
      timeRangeOptions: itemAnalyticsTimeRangeOptions,
      surfaceAnnotationOptions: itemAnalyticsSurfaceAnnotationOptions,
      granularity: { fixed: RAQIV2MetricGranularity.OneDay },
      filterDimensions: [
        RAQIV2Dimension.AgeGroupV2,
        RAQIV2Dimension.Gender,
        RAQIV2Dimension.Platform,
        RAQIV2Dimension.Country,
      ],
      breakdownDimensions: [
        RAQIV2Dimension.AgeGroupV2,
        RAQIV2Dimension.Gender,
        RAQIV2Dimension.Platform,
        RAQIV2Dimension.Country,
      ],
      defaultFilters: [
        {
          dimension: RAQIV2Dimension.AvatarItemId,
          values: contentId ? [contentId] : [],
        },
        {
          dimension: RAQIV2Dimension.AvatarItemTargetType,
          values: [isBundle ? RAQIV2AvatarItemTargetType.Bundle : RAQIV2AvatarItemTargetType.Asset],
        },
      ],
      body: [
        {
          type: RAQIV2SpecialLayoutType.FullWidthLayout,
          items: [tabbedChartConfigItemRevenueAndSales, chartConfigItemPurchaserDemographics],
        },
        {
          type: RAQIV2SpecialLayoutType.VerticalPriorityLayout,
          firstColumn: [chartConfigItemPurchasePlatform],
          secondColumn: [chartConfigItemPurchaserAge, chartConfigItemPurchaserGender],
        },
        {
          type: RAQIV2SpecialLayoutType.VerticalPriorityLayout,
          firstColumn: [tableConfigItemSalesByExperience],
          secondColumn: [chartConfigItemMarketplaceVersusInExperience],
        },
      ],
      preControlCharts: [
        {
          type: RAQIV2SpecialLayoutType.FullWidthLayout,
          items: [arbitraryComponentConfigPublishingAdvanceMetricsCard],
        },
      ],
      additionalBanners: <ItemRestrictedBanner contentId={contentId} isBundle={isBundle} />,
    }),
    [contentId, isBundle],
  );

  // Ownership watermarking is per-metric: each chart card attributes itself to
  // its metric's owner (ROS team id) via the shared RAQI watermark slots, so no
  // page-level ownership wrapper is needed here.
  return getCreatorAnalyticsPageLayout(<CreatorAnalyticsLayout config={pageConfig} />);
};

export default withTranslation(ItemAnalyticsContainer, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Places,
  TranslationNamespace.AssetTypes,
]);
