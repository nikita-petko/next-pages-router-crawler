import React, { useMemo } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnnotationType } from '@modules/clients/analytics';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import getCreatorAnalyticsPageLayout from '@modules/experience-analytics-shared/pages/getCreatorAnalyticsPageLayout';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsEmbeddedSurfaceConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import {
  CreatorAnalyticsPageMode,
  EndDateBehavior,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  tabbedChartConfigCommunityVisits,
  tabbedChartConfigMembershipTrends,
  tabbedChartConfigForumVisits,
  tabbedChartConfigPostsCreated,
  tabbedChartConfigPostViews,
  tabbedChartConfigPostComments,
  tabbedChartConfigPostReactions,
} from './chartConfigs';

const surfaceAnnotationOptions = {
  supportedAnnotationTypes: [] as AnnotationType[],
  defaultAnnotationTypes: [] as AnnotationType[],
  showAnnotationsControl: false,
} as const satisfies AnalyticsPageConfigAnnotationOptions;

const communityDimensions: ReadonlyArray<RAQIV2Dimension> = [
  RAQIV2Dimension.Platform,
  RAQIV2Dimension.AgeGroupV2,
  RAQIV2Dimension.Country,
  RAQIV2Dimension.Gender,
];

const CommunityAnalyticsTabContent: React.FC = () => {
  const config: CreatorAnalyticsEmbeddedSurfaceConfig = useMemo(
    () => ({
      mode: CreatorAnalyticsPageMode.Embedded,
      debugPageName: 'CommunityAnalytics',
      resourceTypes: [RAQIV2ChartResourceType.Group],
      timeRangeOptions: {
        type: 'dateRange',
        supportedRanges: [
          RAQIV2DateRangeType.Last7Days,
          RAQIV2DateRangeType.Last28Days,
          RAQIV2DateRangeType.Last56Days,
          RAQIV2DateRangeType.Last90Days,
          RAQIV2DateRangeType.Custom,
        ],
        defaultRange: RAQIV2DateRangeType.Last7Days,
        excludeEndDateInRange: false,
        minStartDate: new Date('2026-04-01'),
      } as const satisfies AnalyticsPageConfigDateOptions,
      endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
      surfaceAnnotationOptions,
      granularity: { fixed: RAQIV2MetricGranularity.OneDay },
      breakdownDimensions: communityDimensions,
      filterDimensions: communityDimensions,
      body: [
        {
          type: RAQIV2SpecialLayoutType.SectionTitle,
          titleKey: translationKey('Heading.VisitorTraffic', TranslationNamespace.Community),
        },
        {
          type: RAQIV2SpecialLayoutType.FullWidthLayout,
          items: [tabbedChartConfigCommunityVisits],
        },
        {
          type: RAQIV2SpecialLayoutType.SectionTitle,
          titleKey: translationKey('Heading.Membership', TranslationNamespace.Community),
        },
        {
          type: RAQIV2SpecialLayoutType.FullWidthLayout,
          items: [tabbedChartConfigMembershipTrends],
        },
        {
          type: RAQIV2SpecialLayoutType.SectionTitle,
          titleKey: translationKey('Heading.Forums', TranslationNamespace.Community),
        },
        {
          type: RAQIV2SpecialLayoutType.FullWidthLayout,
          items: [tabbedChartConfigForumVisits],
        },
        tabbedChartConfigPostsCreated,
        tabbedChartConfigPostViews,
        tabbedChartConfigPostComments,
        tabbedChartConfigPostReactions,
      ],
    }),
    [],
  );

  return getCreatorAnalyticsPageLayout(<CreatorAnalyticsLayout config={config} />);
};

export default CommunityAnalyticsTabContent;
