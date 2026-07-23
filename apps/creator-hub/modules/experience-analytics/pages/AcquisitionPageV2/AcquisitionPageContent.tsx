import {
  AnalyticsDocLink,
  analyticsUserAcquisitionNavigationItem,
  DateRangeType,
} from '@modules/charts-generic';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import React, { FC, useMemo } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { urls } from '@modules/miscellaneous/common';
import { withTranslation } from '@rbx/intl';
import {
  CreatorAnalyticsFixedTabPageConfig,
  CreatorAnalyticsLayout,
  CreatorAnalyticsPageMode,
  CreatorAnalyticsUntabbedPageConfig,
  OnboardingFeatureKey,
  OnboardingStepKey,
  RAQIV2SpecialLayoutType,
  chartConfigTopSourcesBy30DRevenuePerUser,
  chartConfigTopSourcesByNewUsersWithPlays,
  tabbedChartConfigImpressionsPerSource,
  tabbedChartConfigPlaysPerSource,
  chartConfigTopSourcesByNewUsersWithPlaysMigration,
  chartConfigTopSourcesBy30DRevenuePerUserMigration,
  tabbedChartConfigImpressionsPerSourceMigration,
  tabbedChartConfigPlaysPerSourceMigration,
  chartConfigHomeRecommendationImpressions,
  chartConfigHomeRecommendationPlays,
  chartConfigRFYQualifiedPTR,
  chartConfigRFYL7PlayTime,
  chartConfigRFYL7PlayDays,
  chartConfigRFYL7IntentionalCoplayDays,
  chartConfigRFYDeepEngagementRate,
  chartConfigRFYL7RobuxSpentDays,
  chartConfigRFYL7RobuxSpent,
  tabbedTableConfigNewUsersFunnelV2Migration,
  tabbedTableConfigNewUsersFunnelV2,
  tableConfigShareLinkAcquisitionOverview,
  chartConfigRFYL7PlaySessionsPerUser,
  chartConfigUniqueNotInterestedUsers,
  EndDateBehavior,
} from '@modules/experience-analytics-shared';

import { translationKey } from '@modules/analytics-translations';

import { RAQIV2MetricGranularity, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { arbitraryComponentConfigSimilarExperiencesCards } from './acquisitionPageComponentConfigs';

const userAcquisitionDocLink: AnalyticsDocLink = '/docs/production/analytics/acquisition';

const acquisitionPageConfig: CreatorAnalyticsUntabbedPageConfig = {
  mode: CreatorAnalyticsPageMode.Untabbed,
  debugPageName: 'UserAcquisition',
  docLinks: [userAcquisitionDocLink],
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  title: analyticsUserAcquisitionNavigationItem.title,
  description: {
    standard: translationKey('Description.TakeActionAcquisition', TranslationNamespace.Analytics),
  },
  granularity: { fixed: RAQIV2MetricGranularity.OneDay },
  breakdownDimensions: [],
  filterDimensions: [
    RAQIV2Dimension.Platform,
    RAQIV2Dimension.AgeGroup,
    RAQIV2Dimension.OperatingSystem,
    RAQIV2Dimension.Gender,
    RAQIV2Dimension.UserSegmentationPlatformSpenderStatus,
  ],
  body: [
    chartConfigTopSourcesByNewUsersWithPlays,
    chartConfigTopSourcesBy30DRevenuePerUser,
    tabbedChartConfigImpressionsPerSource,
    tabbedChartConfigPlaysPerSource,
    {
      type: RAQIV2SpecialLayoutType.DropdownSelectorLayout,
      label: translationKey('Label.ViewBy', TranslationNamespace.Analytics),
      items: [
        {
          label: translationKey('Label.ViewByChannels', TranslationNamespace.Analytics),
          value: tabbedTableConfigNewUsersFunnelV2,
        },
        {
          label: translationKey('Label.ViewByExternalLinks', TranslationNamespace.Analytics),
          value: tableConfigShareLinkAcquisitionOverview,
        },
      ],
      id: 'new-user-funnel',
    },
  ],
  timeRangeOptions: {
    type: 'dateRange',
    supportedRanges: [
      DateRangeType.Last7Days,
      DateRangeType.Last28Days,
      DateRangeType.Last56Days,
      DateRangeType.Last90Days,
      DateRangeType.Last365Days,
      DateRangeType.Custom,
    ],
    defaultRange: DateRangeType.Last56Days,
    maxStartDateOffsetDays: 365 * 2,
    minStartDate: new Date('06/01/2023'),
    excludeEndDateInRange: false,
    maxEndDateOffset: 0,
    maxRangeDays: 365 + 1,
  },
  surfaceAnnotationOptions: {
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
    defaultAnnotationTypes: [
      AnnotationType.PlaceIcon,
      AnnotationType.PlaceThumbnail,
      AnnotationType.PlaceVideo,
      AnnotationType.Benchmark,
      AnnotationType.LiveEvent,
    ],
    showAnnotationsControl: true,
  },
  endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
};
const getAcquisitionMigrationPageConfig = (): CreatorAnalyticsUntabbedPageConfig => {
  return {
    mode: CreatorAnalyticsPageMode.Untabbed,
    debugPageName: 'UserAcquisition',
    docLinks: [userAcquisitionDocLink],
    resourceTypes: [RAQIV2ChartResourceType.Universe],
    title: translationKey('Heading.Acquisition', TranslationNamespace.Analytics),
    description: {
      standard: translationKey('Description.TakeActionAcquisition', TranslationNamespace.Analytics),
    },
    timeRangeOptions: acquisitionPageConfig.timeRangeOptions,
    surfaceAnnotationOptions: acquisitionPageConfig.surfaceAnnotationOptions,
    granularity: { fixed: RAQIV2MetricGranularity.OneDay },
    breakdownDimensions: [],
    filterDimensions: [
      RAQIV2Dimension.Platform,
      RAQIV2Dimension.AgeGroup,
      RAQIV2Dimension.OperatingSystem,
      RAQIV2Dimension.Gender,
      RAQIV2Dimension.UserSegmentationPlatformSpenderStatus,
    ],
    body: [
      chartConfigTopSourcesByNewUsersWithPlaysMigration,
      chartConfigTopSourcesBy30DRevenuePerUserMigration,
      tabbedChartConfigImpressionsPerSourceMigration,
      tabbedChartConfigPlaysPerSourceMigration,
      {
        type: RAQIV2SpecialLayoutType.DropdownSelectorLayout,
        label: translationKey('Label.ViewBy', TranslationNamespace.Analytics),
        items: [
          {
            label: translationKey('Label.ViewByChannels', TranslationNamespace.Analytics),
            value: tabbedTableConfigNewUsersFunnelV2Migration,
          },
          {
            label: translationKey('Label.ViewByExternalLinks', TranslationNamespace.Analytics),
            value: tableConfigShareLinkAcquisitionOverview,
          },
        ],
        id: 'new-user-funnel',
      },
    ],
  };
};

const homeRecommendationsSurfaceAnnotationOptions = {
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
  defaultAnnotationTypes: [
    AnnotationType.PlaceThumbnail,
    AnnotationType.PlaceVideo,
    AnnotationType.Benchmark,
  ],
  showAnnotationsControl: true,
};

const homeRecommendationsTimeRangeOptions = {
  ...acquisitionPageConfig.timeRangeOptions,
  minStartDate: new Date('12/01/2024'),
};

enum AcquisitionTabKey {
  Overall = 'overall',
  HomeRecommendations = 'homeRecommendations',
}

const orderedAcquisitionTabKeys = [
  AcquisitionTabKey.Overall,
  AcquisitionTabKey.HomeRecommendations,
] as const;

const getTabbedPageConfig = (
  overallPageConfig: CreatorAnalyticsUntabbedPageConfig,
  {
    isDeepPlayEnabled,
    isNewRFYSignalsEnabled,
  }: { isDeepPlayEnabled: boolean; isNewRFYSignalsEnabled: boolean },
): CreatorAnalyticsFixedTabPageConfig<AcquisitionTabKey> => {
  return {
    mode: CreatorAnalyticsPageMode.FixedTab,
    debugPageName: 'UserAcquisition',
    docLinks: [userAcquisitionDocLink],
    navigationItem: analyticsUserAcquisitionNavigationItem,
    title: analyticsUserAcquisitionNavigationItem.title,
    description: {
      standard: translationKey('Description.TakeActionAcquisition', TranslationNamespace.Analytics),
    },
    tabOrder: orderedAcquisitionTabKeys,
    tabs: {
      [AcquisitionTabKey.Overall]: {
        ...overallPageConfig,
        tabKey: AcquisitionTabKey.Overall,
        label: translationKey('Label.Overall', TranslationNamespace.Analytics),
        body: isNewRFYSignalsEnabled
          ? (() => {
              const { body } = overallPageConfig;
              const last = body[body.length - 1];
              return [...body.slice(0, -1), chartConfigUniqueNotInterestedUsers, last];
            })()
          : overallPageConfig.body,
      },
      [AcquisitionTabKey.HomeRecommendations]: {
        tabKey: AcquisitionTabKey.HomeRecommendations,
        label: translationKey('Label.HomeRecommendations', TranslationNamespace.Analytics),
        onboardingTipsConfig: {
          featureKey: OnboardingFeatureKey.CreatorHubAnalyticsAcquisitionRfy,
          stepKey: OnboardingStepKey.HomeRecommendationTab,
        },
        resourceTypes: [RAQIV2ChartResourceType.Universe],
        filterDimensions: [RAQIV2Dimension.AgeGroup, RAQIV2Dimension.Gender],
        breakdownDimensions: [RAQIV2Dimension.AgeGroup, RAQIV2Dimension.Gender],
        granularity: { fixed: RAQIV2MetricGranularity.OneDay },
        timeRangeOptions: homeRecommendationsTimeRangeOptions,
        surfaceAnnotationOptions: homeRecommendationsSurfaceAnnotationOptions,
        body: [
          chartConfigHomeRecommendationImpressions,
          chartConfigHomeRecommendationPlays,
          {
            type: RAQIV2SpecialLayoutType.SectionTitle,
            titleKey: translationKey(
              'Title.HomeRecommendationSignals',
              TranslationNamespace.Analytics,
            ),
            tooltipKey: translationKey(
              'Description.HomeRecommendationSignals',
              TranslationNamespace.Analytics,
            ),
            description: {
              key: translationKey(
                'Disclaimer.HomeRecommendationSignals',
                TranslationNamespace.Analytics,
              ),
              link: urls.creatorHub.docs.getDiscoveryUrl(),
            },
            onboardingTipsConfig: {
              featureKey: OnboardingFeatureKey.CreatorHubAnalyticsAcquisitionRfy,
              stepKey: OnboardingStepKey.HomeRecommendationSignalsSectionTitle,
            },
          },
          chartConfigRFYQualifiedPTR,
          ...(isDeepPlayEnabled ? [chartConfigRFYDeepEngagementRate] : []),
          chartConfigRFYL7PlayTime,
          chartConfigRFYL7PlayDays,
          chartConfigRFYL7IntentionalCoplayDays,
          chartConfigRFYL7RobuxSpentDays,
          chartConfigRFYL7RobuxSpent,
          ...(isNewRFYSignalsEnabled ? [chartConfigRFYL7PlaySessionsPerUser] : []),
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [arbitraryComponentConfigSimilarExperiencesCards],
          },
        ],
      },
    },
  };
};
const AcquisitionPageContent: FC = () => {
  const { acquisitionMigrationMetricsEnabled, isDeepPlayEnabled, isNewRFYSignalsEnabled } =
    useFeatureFlagsForNamespace(
      ['acquisitionMigrationMetricsEnabled', 'isDeepPlayEnabled', 'isNewRFYSignalsEnabled'],
      FeatureFlagNamespace.Analytics,
    );
  const pageConfig = useMemo(() => {
    if (acquisitionMigrationMetricsEnabled) {
      return getAcquisitionMigrationPageConfig();
    }
    return getTabbedPageConfig(acquisitionPageConfig, {
      isDeepPlayEnabled,
      isNewRFYSignalsEnabled,
    });
  }, [acquisitionMigrationMetricsEnabled, isDeepPlayEnabled, isNewRFYSignalsEnabled]);
  return <CreatorAnalyticsLayout config={pageConfig} />;
};

export default withTranslation(AcquisitionPageContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
]);
