import React, { useMemo } from 'react';
import { withTranslation } from '@rbx/intl';
import { useRouter } from 'next/router';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  getCreatorAnalyticsPageLayout,
  RAQIV2SpecialLayoutType,
  CreatorAnalyticsUntabbedPageConfig,
  CreatorAnalyticsLayout,
  CreatorAnalyticsPageMode,
  AnalyticsFlagGatedContext,
} from '@modules/experience-analytics-shared';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import {
  RAQIV2Dimension,
  RAQIV2AvatarItemTargetType,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { DateRangeType, AnalyticsDocLink } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { arbitraryComponentConfigPublishingAdvanceMetricsCard } from './itemAnalyticsComponentConfigs';
import {
  chartConfigItemMarketplaceVersusInExperience,
  chartConfigItemPurchasePlatform,
  chartConfigItemPurchaserAge,
  chartConfigItemPurchaserDemographics,
  chartConfigItemPurchaserGender,
  tabbedChartConfigItemRevenueAndSales,
} from './itemAnalyticsChartConfigs';
import { tableConfigItemSalesByExperience } from './itemAnalyticsTableConfigs';
import ItemRestrictedBanner from './ItemRestrictedBanner';

interface ItemAnalyticsContainerProps {
  isBundle?: boolean;
}

const itemAnalyticsDocLink: AnalyticsDocLink = '/docs/production/analytics/item-analytics';

const itemAnalyticsTimeRangeOptions = {
  type: 'dateRange',
  supportedRanges: [
    DateRangeType.Last7Days,
    DateRangeType.Last28Days,
    DateRangeType.Last56Days,
    DateRangeType.Last90Days,
  ],
  defaultRange: DateRangeType.Last28Days,
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
        RAQIV2Dimension.AgeGroup,
        RAQIV2Dimension.Gender,
        RAQIV2Dimension.Platform,
        RAQIV2Dimension.Country,
      ],
      breakdownDimensions: [
        RAQIV2Dimension.AgeGroup,
        RAQIV2Dimension.Gender,
        RAQIV2Dimension.Platform,
        RAQIV2Dimension.Country,
      ],
      defaultFilters: [
        {
          dimension: RAQIV2Dimension.AvatarItemId,
          values: id ? [id as string] : [],
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
      additionalBanners: <ItemRestrictedBanner contentId={id as string} isBundle={isBundle} />,
    }),
    [id, isBundle],
  );

  return (
    <AnalyticsFlagGatedContext flag='ugcItemAnalyticsEnabled'>
      {getCreatorAnalyticsPageLayout(<CreatorAnalyticsLayout config={pageConfig} />)}
    </AnalyticsFlagGatedContext>
  );
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
