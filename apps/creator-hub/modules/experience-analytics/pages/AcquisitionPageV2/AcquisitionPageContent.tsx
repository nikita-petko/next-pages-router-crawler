import type { FC } from 'react';
import { useMemo } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { useFlag } from '@rbx/flags';
import { withTranslation } from '@rbx/intl';
import { acquisitionMigrationMetricsEnabled as acquisitionMigrationMetricsEnabledFlag } from '@generated/flags/creatorAnalytics';
import { isHomeAcquisitionSignalsEnabled as isHomeAcquisitionSignalsEnabledFlag } from '@generated/flags/gameDiscoveryServing';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsUserAcquisitionNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import {
  chartConfigRFYDeepEngagementRate,
  chartConfigRFYL7IntentionalCoplayDays,
  chartConfigRFYL7PlayDays,
  chartConfigRFYL7PlaySessionsPerUser,
  chartConfigRFYL7PlayTime,
  chartConfigRFYL7RobuxSpent,
  chartConfigRFYL7RobuxSpentDays,
  chartConfigHomeRecommendationImpressions,
  chartConfigHomeRecommendationPlays,
  chartConfigRFYPlayThroughRate,
  chartConfigRFYQualifiedPTR,
  chartConfigTopSourcesBy30DRevenuePerUser,
  chartConfigTopSourcesBy30DRevenuePerUserMigration,
  chartConfigTopSourcesByNewUsersWithPlays,
  chartConfigTopSourcesByNewUsersWithPlaysMigration,
  chartConfigUniqueNotInterestedUsers,
} from '@modules/experience-analytics-shared/constants/chart-configs/PredefinedChartConfigLiterals';
import {
  tabbedChartConfigImpressionsPerSource,
  tabbedChartConfigImpressionsPerSourceMigration,
  tabbedChartConfigPlaysPerSource,
  tabbedChartConfigPlaysPerSourceMigration,
  tabbedChartConfigRFYCoplayDays,
  tabbedChartConfigRFYFirstPlayBounceRate,
  tabbedChartConfigRFYPlayDays,
  tabbedChartConfigRFYPlaytimePerUser,
  tabbedChartConfigRFYQualifiedPlaySessionsPerUser,
  tabbedChartConfigRFYRobuxSpend,
  tabbedChartConfigRFYSpendDays,
} from '@modules/experience-analytics-shared/constants/chart-configs/PredefinedTabbedChartConfigLiterals';
import {
  getTabbedTableConfigNewUsersFunnelV2,
  tabbedTableConfigNewUsersFunnelV2Migration,
} from '@modules/experience-analytics-shared/constants/chart-configs/PredefinedTabbedTableConfigLiterals';
import { tableConfigShareLinkAcquisitionOverview } from '@modules/experience-analytics-shared/constants/chart-configs/PredefinedTableConfigLiterals';
import {
  OnboardingFeatureKey,
  OnboardingStepKey,
} from '@modules/experience-analytics-shared/constants/onboardingTipsConfigs';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import type {
  CreatorAnalyticsFixedTabPageConfig,
  CreatorAnalyticsUntabbedPageConfig,
  RAQIV2UIComponent,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import {
  CreatorAnalyticsPageMode,
  EndDateBehavior,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { arbitraryComponentConfigSimilarExperiencesCards } from './acquisitionPageComponentConfigs';
import AcquisitionPageVideoBanner from './AcquisitionPageVideoBanner';

const userAcquisitionDocLink: AnalyticsDocLink = '/docs/production/analytics/acquisition';

const acquisitionTimeRangeOptions: CreatorAnalyticsUntabbedPageConfig['timeRangeOptions'] = {
  type: 'dateRange',
  supportedRanges: [
    RAQIV2DateRangeType.Last7Days,
    RAQIV2DateRangeType.Last28Days,
    RAQIV2DateRangeType.Last56Days,
    RAQIV2DateRangeType.Last90Days,
    RAQIV2DateRangeType.Custom,
  ],
  defaultRange: RAQIV2DateRangeType.Last56Days,
  maxStartDateOffsetDays: 365 * 2,
  minStartDate: new Date('06/01/2023'),
  excludeEndDateInRange: false,
  maxEndDateOffset: 0,
  maxRangeDays: 365 + 1,
};

const acquisitionSurfaceAnnotationOptions: CreatorAnalyticsUntabbedPageConfig['surfaceAnnotationOptions'] =
  {
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
  };

const getAcquisitionPageConfig = (
  isHomeAcquisitionSignalsEnabled: boolean,
): CreatorAnalyticsUntabbedPageConfig => ({
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
    RAQIV2Dimension.AgeGroupV2,
    RAQIV2Dimension.OperatingSystem,
    RAQIV2Dimension.Gender,
    RAQIV2Dimension.UserSegmentationPlatformSpenderStatus,
    RAQIV2Dimension.UserSegmentationPlatformActivationStatus,
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
          value: getTabbedTableConfigNewUsersFunnelV2(isHomeAcquisitionSignalsEnabled),
        },
        {
          label: translationKey('Label.ViewByExternalLinks', TranslationNamespace.Analytics),
          value: tableConfigShareLinkAcquisitionOverview,
        },
      ],
      id: 'new-user-funnel',
    },
  ],
  timeRangeOptions: acquisitionTimeRangeOptions,
  surfaceAnnotationOptions: acquisitionSurfaceAnnotationOptions,
  endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
});
export const getAcquisitionMigrationPageConfig = (): CreatorAnalyticsUntabbedPageConfig => {
  return {
    mode: CreatorAnalyticsPageMode.Untabbed,
    debugPageName: 'UserAcquisition',
    docLinks: [userAcquisitionDocLink],
    resourceTypes: [RAQIV2ChartResourceType.Universe],
    title: translationKey('Heading.Acquisition', TranslationNamespace.Analytics),
    description: {
      standard: translationKey('Description.TakeActionAcquisition', TranslationNamespace.Analytics),
    },
    timeRangeOptions: acquisitionTimeRangeOptions,
    surfaceAnnotationOptions: acquisitionSurfaceAnnotationOptions,
    endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
    granularity: { fixed: RAQIV2MetricGranularity.OneDay },
    breakdownDimensions: [],
    filterDimensions: [
      RAQIV2Dimension.Platform,
      RAQIV2Dimension.AgeGroupV2,
      RAQIV2Dimension.OperatingSystem,
      RAQIV2Dimension.Gender,
      RAQIV2Dimension.UserSegmentationPlatformSpenderStatus,
      RAQIV2Dimension.UserSegmentationPlatformActivationStatus,
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
  ...acquisitionTimeRangeOptions,
  minStartDate: new Date('12/01/2024'),
};

export enum AcquisitionTabKey {
  Overall = 'overall',
  HomeRecommendations = 'homeRecommendations',
}

const orderedAcquisitionTabKeys = [
  AcquisitionTabKey.Overall,
  AcquisitionTabKey.HomeRecommendations,
] as const;

export const getTabbedPageConfig = (
  overallPageConfig: CreatorAnalyticsUntabbedPageConfig,
  isHomeAcquisitionSignalsEnabled: boolean,
): CreatorAnalyticsFixedTabPageConfig<AcquisitionTabKey> => {
  const homeRecommendationsSummaryCards: RAQIV2UIComponent = {
    type: RAQIV2SpecialLayoutType.TwoPerRowLayout,
    // Stack full-width on mobile so the summary cards aren't squeezed; render
    // two-per-row from Medium up.
    stackOnCompact: true,
    items: [chartConfigHomeRecommendationImpressions, chartConfigHomeRecommendationPlays],
  };
  const homeRecommendationsSignalsHeader: RAQIV2UIComponent = {
    type: RAQIV2SpecialLayoutType.SectionTitle,
    titleKey: translationKey('Title.HomeRecommendationSignals', TranslationNamespace.Analytics),
    description: [
      {
        key: translationKey(
          'Description.HomeRecommendationSignalsV2',
          TranslationNamespace.Analytics,
        ),
        link: creatorHub.docs.getDiscoveryUrl(),
      },
      {
        key: translationKey(
          'Description.RFYSignalWeightsDocumentation',
          TranslationNamespace.Analytics,
        ),
        link: creatorHub.docs.getDiscoveryKeySignalsUrl(),
      },
    ],
    onboardingTipsConfig: {
      featureKey: OnboardingFeatureKey.CreatorHubAnalyticsAcquisitionRfy,
      stepKey: OnboardingStepKey.HomeRecommendationSignalsSectionTitle,
    },
  };
  const homeRecommendationsSignalsGrid: RAQIV2UIComponent = {
    type: RAQIV2SpecialLayoutType.TwoPerRowLayout,
    // Stack full-width on mobile so the signal cards aren't squeezed; render
    // two-per-row from Medium up.
    stackOnCompact: true,
    items: [
      chartConfigRFYPlayThroughRate,
      tabbedChartConfigRFYFirstPlayBounceRate,
      tabbedChartConfigRFYPlayDays,
      tabbedChartConfigRFYPlaytimePerUser,
      tabbedChartConfigRFYCoplayDays,
      tabbedChartConfigRFYQualifiedPlaySessionsPerUser,
      tabbedChartConfigRFYSpendDays,
      tabbedChartConfigRFYRobuxSpend,
    ],
  };
  const similarExperiencesCards: RAQIV2UIComponent = {
    type: RAQIV2SpecialLayoutType.FullWidthLayout,
    items: [arbitraryComponentConfigSimilarExperiencesCards],
  };
  const legacyHomeRecommendationsSignalsSection: RAQIV2UIComponent = {
    type: RAQIV2SpecialLayoutType.SectionTitle,
    titleKey: translationKey('Title.HomeRecommendationSignals', TranslationNamespace.Analytics),
    tooltipKey: translationKey(
      'Description.HomeRecommendationSignals',
      TranslationNamespace.Analytics,
    ),
    description: [
      {
        key: translationKey('Disclaimer.HomeRecommendationSignals', TranslationNamespace.Analytics),
        link: creatorHub.docs.getDiscoveryUrl(),
      },
    ],
    onboardingTipsConfig: {
      featureKey: OnboardingFeatureKey.CreatorHubAnalyticsAcquisitionRfy,
      stepKey: OnboardingStepKey.HomeRecommendationSignalsSectionTitle,
    },
  };
  const legacyHomeRecommendationsBody: RAQIV2UIComponent[] = [
    chartConfigHomeRecommendationImpressions,
    chartConfigHomeRecommendationPlays,
    legacyHomeRecommendationsSignalsSection,
    chartConfigRFYQualifiedPTR,
    chartConfigRFYDeepEngagementRate,
    chartConfigRFYL7PlayTime,
    chartConfigRFYL7PlayDays,
    chartConfigRFYL7IntentionalCoplayDays,
    chartConfigRFYL7RobuxSpentDays,
    chartConfigRFYL7RobuxSpent,
    chartConfigRFYL7PlaySessionsPerUser,
    similarExperiencesCards,
  ];
  const redesignedHomeRecommendationsBody: RAQIV2UIComponent[] = [
    homeRecommendationsSummaryCards,
    homeRecommendationsSignalsHeader,
    homeRecommendationsSignalsGrid,
    similarExperiencesCards,
  ];
  const homeRecommendationsBody = isHomeAcquisitionSignalsEnabled
    ? redesignedHomeRecommendationsBody
    : legacyHomeRecommendationsBody;

  return {
    mode: CreatorAnalyticsPageMode.FixedTab,
    debugPageName: 'UserAcquisition',
    docLinks: [userAcquisitionDocLink],
    navigationItem: analyticsUserAcquisitionNavigationItem,
    title: analyticsUserAcquisitionNavigationItem.title,
    description: {
      standard: translationKey('Description.TakeActionAcquisition', TranslationNamespace.Analytics),
    },
    fallbackBanner: <AcquisitionPageVideoBanner />,
    tabOrder: orderedAcquisitionTabKeys,
    tabs: {
      [AcquisitionTabKey.Overall]: {
        ...overallPageConfig,
        tabKey: AcquisitionTabKey.Overall,
        label: translationKey('Label.Overall', TranslationNamespace.Analytics),
        body: (() => {
          const { body } = overallPageConfig;
          const last = body[body.length - 1];
          return [...body.slice(0, -1), chartConfigUniqueNotInterestedUsers, last];
        })(),
      },
      [AcquisitionTabKey.HomeRecommendations]: {
        tabKey: AcquisitionTabKey.HomeRecommendations,
        label: translationKey('Label.HomeRecommendations', TranslationNamespace.Analytics),
        onboardingTipsConfig: {
          featureKey: OnboardingFeatureKey.CreatorHubAnalyticsAcquisitionRfy,
          stepKey: OnboardingStepKey.HomeRecommendationTab,
        },
        resourceTypes: [RAQIV2ChartResourceType.Universe],
        filterDimensions: [RAQIV2Dimension.AgeGroupV2, RAQIV2Dimension.Gender],
        breakdownDimensions: [RAQIV2Dimension.AgeGroupV2, RAQIV2Dimension.Gender],
        granularity: { fixed: RAQIV2MetricGranularity.OneDay },
        timeRangeOptions: homeRecommendationsTimeRangeOptions,
        surfaceAnnotationOptions: homeRecommendationsSurfaceAnnotationOptions,
        body: homeRecommendationsBody,
      },
    },
  };
};
const AcquisitionPageContent: FC = () => {
  const { id: universeId } = useUniverseResource();
  const { ready: isHomeAcquisitionSignalsReady, value: isHomeAcquisitionSignalsEnabledValue } =
    useFlag(isHomeAcquisitionSignalsEnabledFlag, { universeId });
  const isHomeAcquisitionSignalsEnabled =
    isHomeAcquisitionSignalsReady && isHomeAcquisitionSignalsEnabledValue;
  const {
    ready: acquisitionMigrationMetricsReady,
    value: acquisitionMigrationMetricsEnabledValue,
  } = useFlag(acquisitionMigrationMetricsEnabledFlag);
  const acquisitionMigrationMetricsEnabled =
    acquisitionMigrationMetricsReady && acquisitionMigrationMetricsEnabledValue;
  const pageConfig = useMemo(() => {
    if (acquisitionMigrationMetricsEnabled) {
      return getTabbedPageConfig(
        {
          ...getAcquisitionMigrationPageConfig(),
        },
        isHomeAcquisitionSignalsEnabled,
      );
    }
    return getTabbedPageConfig(
      {
        ...getAcquisitionPageConfig(isHomeAcquisitionSignalsEnabled),
      },
      isHomeAcquisitionSignalsEnabled,
    );
  }, [acquisitionMigrationMetricsEnabled, isHomeAcquisitionSignalsEnabled]);
  return <CreatorAnalyticsLayout config={pageConfig} />;
};

export default withTranslation(AcquisitionPageContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
]);
