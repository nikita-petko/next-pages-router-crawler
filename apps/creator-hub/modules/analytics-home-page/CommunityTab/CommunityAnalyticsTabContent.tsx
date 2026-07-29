import React, { useMemo } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { useFlag } from '@rbx/flags';
import { announcementAnalytics } from '@generated/flags/communities';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnnotationType } from '@modules/clients/analytics';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { AnalyticsQueryGatewayAPIFilterOperation } from '@modules/clients/analytics/analyticsQueryGateway';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import AnalyticsConfigTable from '@modules/experience-analytics-shared/components/RAQIV2/table/AnalyticsConfigTable';
import { ANNOUNCEMENT_ANALYTICS_START_DATE } from '@modules/experience-analytics-shared/constants/announcementDisplay';
import { AnnouncementNameMapProvider } from '@modules/experience-analytics-shared/context/AnnouncementNameMapProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
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
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { getAnnouncementCompareChartConfig } from './AnnouncementCompareChart';
import { getAnnouncementEngagementConfig } from './AnnouncementEngagementDropdown';
import { getAnnouncementNotificationCtrConfig } from './AnnouncementNotificationCtrDropdown';
import {
  tabbedChartConfigCommunityVisits,
  tabbedChartConfigMembershipTrends,
  tabbedChartConfigForumVisits,
  tabbedChartConfigPostsCreated,
  tabbedChartConfigPostViews,
  tabbedChartConfigPostComments,
  tabbedChartConfigPostReactions,
  tabbedChartConfigAnnouncementVisits,
  getTableConfigAnnouncementHistory,
} from './chartConfigs';

const COMMUNITY_ANALYTICS_START_DATE = new Date('2026-04-01');

function getAnnouncementHistoryTableConfig(
  translate: ReturnType<typeof useRAQIV2TranslationDependencies>['translate'],
): ArbitraryComponentConfig {
  return {
    type: AnalyticsComponentType.NonGeneric,
    metrics: [
      RAQIV2Metric.CommunityAnnouncementEventCount,
      RAQIV2Metric.CommunityAnnouncementUniqueUsers,
    ],
    renderer: {
      type: 'withChartContext',
      render: (chartContext) => (
        <AnalyticsConfigTable
          config={getTableConfigAnnouncementHistory(translate)}
          tableContext={{
            ...chartContext,
            timeSpec: {
              rangeType: RAQIV2DateRangeType.Custom,
              startTime: ANNOUNCEMENT_ANALYTICS_START_DATE,
              endTime: new Date(),
            },
            filter: [
              {
                dimension: RAQIV2Dimension.AnnouncementPublishDate,
                values: [String(ANNOUNCEMENT_ANALYTICS_START_DATE.getTime())],
                operation: AnalyticsQueryGatewayAPIFilterOperation.Gte,
              },
            ],
          }}
        />
      ),
    },
  };
}

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
  const currentGroup = useCurrentGroup();
  const { translate } = useRAQIV2TranslationDependencies();
  const { value: showAnnouncements } = useFlag(
    announcementAnalytics,
    currentGroup ? { groupId: currentGroup.id } : { groupId: 0 },
  );

  const config: CreatorAnalyticsEmbeddedSurfaceConfig = useMemo(() => {
    const body: CreatorAnalyticsEmbeddedSurfaceConfig['body'] = [
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
    ];

    if (showAnnouncements) {
      body.push(
        {
          type: RAQIV2SpecialLayoutType.SectionTitle,
          titleKey: translationKey('Heading.Announcements', TranslationNamespace.Community),
          tooltipKey: translationKey(
            'Description.AnnouncementDataAvailability',
            TranslationNamespace.Community,
          ),
        },
        tabbedChartConfigAnnouncementVisits,
        getAnnouncementEngagementConfig(),
        {
          type: RAQIV2SpecialLayoutType.FullWidthLayout,
          items: [getAnnouncementNotificationCtrConfig()],
        },
        {
          type: RAQIV2SpecialLayoutType.FullWidthLayout,
          items: [getAnnouncementCompareChartConfig()],
        },
        {
          type: RAQIV2SpecialLayoutType.FullWidthLayout,
          items: [getAnnouncementHistoryTableConfig(translate)],
        },
      );
    }

    return {
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
        minStartDate: COMMUNITY_ANALYTICS_START_DATE,
      } as const satisfies AnalyticsPageConfigDateOptions,
      endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
      surfaceAnnotationOptions,
      granularity: { fixed: RAQIV2MetricGranularity.OneDay },
      breakdownDimensions: communityDimensions,
      filterDimensions: communityDimensions,
      body,
    };
  }, [showAnnouncements, translate]);

  const layout = <CreatorAnalyticsLayout config={config} />;
  return getCreatorAnalyticsPageLayout(
    showAnnouncements ? (
      <AnnouncementNameMapProvider>{layout}</AnnouncementNameMapProvider>
    ) : (
      layout
    ),
  );
};

export default CommunityAnalyticsTabContent;
