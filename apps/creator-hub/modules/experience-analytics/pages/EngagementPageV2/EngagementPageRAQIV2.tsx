import { useMemo } from 'react';
import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { withTranslation } from '@rbx/intl';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsEngagementNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import RAQIV2PredefinedChartKey from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartKey';
import RAQIV2PredefinedTabbedChartKey from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTabbedChartKey';
import {
  CreatorAnalyticsPageMode,
  EndDateBehavior,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsUntabbedPageConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import engagementDimensions from './engagementDimensions';

const engagementDocLink: AnalyticsDocLink = '/docs/production/analytics/engagement';
const userAcquisitionDocLink: AnalyticsDocLink = '/docs/production/analytics/acquisition';

const EngagementPageRAQIV2 = () => {
  const engagementPageConfig: CreatorAnalyticsUntabbedPageConfig = useMemo(
    () => ({
      mode: CreatorAnalyticsPageMode.Untabbed,
      debugPageName: 'Engagement',
      title: analyticsEngagementNavigationItem.title,
      description: {
        standard: translationKey(
          'Description.TakeActionEngagement',
          TranslationNamespace.Analytics,
        ),
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
          RAQIV2DateRangeType.Last7Days,
          RAQIV2DateRangeType.Last28Days,
          RAQIV2DateRangeType.Last56Days,
          RAQIV2DateRangeType.Last90Days,
          RAQIV2DateRangeType.Last365Days,
          RAQIV2DateRangeType.Custom,
        ],
        defaultRange: RAQIV2DateRangeType.Last28Days,
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
    }),
    [],
  );

  return <CreatorAnalyticsLayout config={engagementPageConfig} />;
};
export default withTranslation(EngagementPageRAQIV2, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.Navigation,
]);
