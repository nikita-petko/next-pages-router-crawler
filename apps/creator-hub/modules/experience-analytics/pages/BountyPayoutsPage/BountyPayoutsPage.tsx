import { useMemo } from 'react';
import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsUntabbedPageConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { CreatorAnalyticsPageMode } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  chartConfigAvgPlaytimePerSubscriber,
  chartConfigAvgRobuxSpentPerSubscriber,
  chartConfigBountyPayoutsByUiEntryPoint,
  chartConfigDailySubscribersInExperience,
  chartConfigPlusSubscribersBySource,
  chartConfigSubscriberSpendInExperience,
} from './chartConfigs';

const robloxPlusDocLink: AnalyticsDocLink = '/docs/production/monetization/roblox-plus';
const robloxPlusEarnDocLink: AnalyticsDocLink =
  '/docs/production/monetization/roblox-plus#earn-from-in-experience-plus-subscriptions';

const bountyPayoutsTimeRangeOptions = {
  type: 'dateRange',
  supportedRanges: [
    RAQIV2DateRangeType.Last7Days,
    RAQIV2DateRangeType.Last28Days,
    RAQIV2DateRangeType.Last56Days,
    RAQIV2DateRangeType.Last90Days,
    RAQIV2DateRangeType.Last365Days,
    RAQIV2DateRangeType.Custom,
  ],
  defaultRange: RAQIV2DateRangeType.Last28Days,
} as const satisfies AnalyticsPageConfigDateOptions;

const bountyPayoutsSurfaceAnnotationOptions = {
  supportedAnnotationTypes: [
    AnnotationType.PlaceIcon,
    AnnotationType.PlaceThumbnail,
    AnnotationType.PlaceVersion,
    AnnotationType.LiveEvent,
    AnnotationType.ConfigVersion,
    AnnotationType.Announcement,
  ],
  defaultAnnotationTypes: [],
  showAnnotationsControl: true,
} as const satisfies AnalyticsPageConfigAnnotationOptions;

const BountyPayoutsPage = () => {
  const bountyPayoutsPageConfig: CreatorAnalyticsUntabbedPageConfig = useMemo(
    () => ({
      mode: CreatorAnalyticsPageMode.Untabbed,
      debugPageName: 'BountyPayouts',
      title: translationKey('Heading.RobloxPlusDeveloperProgram', TranslationNamespace.Analytics),
      description: {
        standard: translationKey(
          'Description.RobloxPlusDeveloperProgram',
          TranslationNamespace.Analytics,
        ),
      },
      resourceTypes: [RAQIV2ChartResourceType.Universe],
      timeRangeOptions: bountyPayoutsTimeRangeOptions,
      surfaceAnnotationOptions: bountyPayoutsSurfaceAnnotationOptions,
      granularity: {
        options: [
          RAQIV2MetricGranularity.OneDay,
          RAQIV2MetricGranularity.OneWeek,
          RAQIV2MetricGranularity.OneMonth,
        ],
      },
      filterDimensions: [],
      breakdownDimensions: [],
      docLinks: [robloxPlusDocLink],
      body: [
        {
          type: RAQIV2SpecialLayoutType.SectionTitle,
          titleKey: translationKey('Title.PlusSubscriberInsights', TranslationNamespace.Analytics),
          description: [
            {
              key: translationKey(
                'Description.PlusSubscriberInsights',
                TranslationNamespace.Analytics,
              ),
            },
          ],
        },
        chartConfigDailySubscribersInExperience,
        chartConfigSubscriberSpendInExperience,
        chartConfigAvgPlaytimePerSubscriber,
        chartConfigAvgRobuxSpentPerSubscriber,
        {
          type: RAQIV2SpecialLayoutType.SectionTitle,
          titleKey: translationKey('Title.DeveloperIncentives', TranslationNamespace.Analytics),
          description: [
            {
              key: translationKey(
                'Description.DeveloperIncentives',
                TranslationNamespace.Analytics,
              ),
              link: robloxPlusEarnDocLink,
            },
          ],
        },
        {
          type: RAQIV2SpecialLayoutType.FullWidthLayout,
          items: [chartConfigBountyPayoutsByUiEntryPoint],
        },
        {
          type: RAQIV2SpecialLayoutType.FullWidthLayout,
          items: [chartConfigPlusSubscribersBySource],
        },
      ],
    }),
    [],
  );

  return <CreatorAnalyticsLayout config={bountyPayoutsPageConfig} />;
};

export default BountyPayoutsPage;
