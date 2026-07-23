import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import React from 'react';
import {
  analyticsEngagementNavigationItem,
  DateRangeType,
  AnalyticsDocLink,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  RAQIV2PredefinedChartKey,
  RAQIV2PredefinedTabbedChartKey,
  CreatorAnalyticsUntabbedPageConfig,
  CreatorAnalyticsLayout,
  CreatorAnalyticsPageMode,
  RAQIV2SpecialLayoutType,
  EndDateBehavior,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import engagementDimensions from './engagementDimensions';

const engagementDocLink: AnalyticsDocLink = '/docs/production/analytics/engagement';
const userAcquisitionDocLink: AnalyticsDocLink = '/docs/production/analytics/acquisition';

const EngagementPageRAQIV2 = () => {
  const engagementPageConfig: CreatorAnalyticsUntabbedPageConfig = {
    mode: CreatorAnalyticsPageMode.Untabbed,
    debugPageName: 'Engagement',
    title: analyticsEngagementNavigationItem.title,
    description: {
      standard: translationKey('Description.TakeActionEngagement', TranslationNamespace.Analytics),
      mobile: translationKey(
        'Description.TakeActionEngagementMobile',
        TranslationNamespace.Analytics,
      ),
    },
    docLinks: [engagementDocLink, userAcquisitionDocLink],
    resourceTypes: [RAQIV2ChartResourceType.Universe],
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
      defaultRange: DateRangeType.Last28Days,
      excludeEndDateInRange: false,
      maxEndDateOffset: 0,
      maxStartDateOffsetDays: 365 * 2,
      maxRangeDays: 365 * 2 + 1,
    } as const satisfies AnalyticsPageConfigDateOptions,
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
      defaultAnnotationTypes: [AnnotationType.Benchmark, AnnotationType.LiveEvent],
      showAnnotationsControl: true,
    } as const satisfies AnalyticsPageConfigAnnotationOptions,
    granularity: {
      options: [
        RAQIV2MetricGranularity.OneDay,
        RAQIV2MetricGranularity.OneWeek,
        RAQIV2MetricGranularity.OneMonth,
      ],
    },
    breakdownDimensions: engagementDimensions,
    filterDimensions: engagementDimensions,
    body: [
      RAQIV2PredefinedChartKey.DailyActiveUsers,
      RAQIV2PredefinedTabbedChartKey.DailyActiveUsers,
      RAQIV2PredefinedChartKey.EngagementAveragePlayTimePerDAU,
      RAQIV2PredefinedChartKey.EngagementTotalPlayTime,
      RAQIV2PredefinedChartKey.EngagementAverageSessionTime,
      RAQIV2PredefinedTabbedChartKey.EngagementSessionTime,
      RAQIV2PredefinedChartKey.EngagementNewUserSessionTimeRetention,
      RAQIV2PredefinedChartKey.EngagementSessions,
      {
        type: RAQIV2SpecialLayoutType.FullWidthLayout,
        items: [RAQIV2PredefinedChartKey.MonthlyActiveUsers],
      },
    ],
    endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
  };

  return <CreatorAnalyticsLayout config={engagementPageConfig} />;
};
export default withTranslation(EngagementPageRAQIV2, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.Navigation,
]);
