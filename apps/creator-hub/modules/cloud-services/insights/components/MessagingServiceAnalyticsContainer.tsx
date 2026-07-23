import type { FunctionComponent } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { useFlag } from '@rbx/flags';
import { withTranslation } from '@rbx/intl';
import { isCsmExtendedMetricsEnabled } from '@generated/flags/creatorServicesInsights';
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
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  chartConfigMessagingServiceFanoutRatio,
  chartConfigMessagingServiceFanoutRatioExtended,
  chartConfigMessagingServiceMessageSizeBytes,
  chartConfigMessagingServicePublishedMessagesCount,
  chartConfigMessagingServicePublishedMessagesCountExtended,
  chartConfigMessagingServiceReceivedMessagesCount,
  chartConfigMessagingServiceReceivedMessagesCountExtended,
  chartConfigMessagingServiceGameServersConnectedCount,
} from './messagingServiceChartConfigs';

const messagingServiceRateLimitsDocLink: AnalyticsDocLink =
  '/docs/reference/engine/classes/MessagingService';

const getPageConfig = (
  showCsmExtendedMetrics: boolean | null | undefined,
): CreatorAnalyticsUntabbedPageConfig => {
  const messagingServiceAnalyticsConfig: CreatorAnalyticsUntabbedPageConfig = {
    mode: CreatorAnalyticsPageMode.Untabbed,
    debugPageName: 'MessagingService',
    docLinks: [messagingServiceRateLimitsDocLink],
    resourceTypes: [RAQIV2ChartResourceType.Universe],
    title: translationKey('Heading.MessagingService', TranslationNamespace.Analytics),
    description: {
      standard: translationKey(
        'Description.MessagingServiceObservability',
        TranslationNamespace.Analytics,
      ),
    },
    timeRangeOptions: {
      type: 'dateRange',
      supportedRanges: [
        RAQIV2DateRangeType.Last1Hour,
        RAQIV2DateRangeType.Last1Day,
        RAQIV2DateRangeType.Last7Days,
        RAQIV2DateRangeType.Custom,
      ],
      defaultRange: RAQIV2DateRangeType.Last1Day,
    } as const satisfies AnalyticsPageConfigDateOptions,
    surfaceAnnotationOptions: {
      supportedAnnotationTypes: [
        AnnotationType.PlaceIcon,
        AnnotationType.PlaceThumbnail,
        AnnotationType.PlaceVersion,
        AnnotationType.ConfigVersion,
        AnnotationType.Announcement,
      ],
      defaultAnnotationTypes: [],
      showAnnotationsControl: false,
    } as const satisfies AnalyticsPageConfigAnnotationOptions,
    granularity: {
      options: [
        RAQIV2MetricGranularity.HalfHour,
        RAQIV2MetricGranularity.OneHour,
        RAQIV2MetricGranularity.OneDay,
        RAQIV2MetricGranularity.OneMinute,
      ],
      constraints: {
        [RAQIV2MetricGranularity.OneMinute]: [
          { type: 'duration', maxDurationMs: 24 * 60 * 60 * 1000 },
        ],
      },
    },
    filterDimensions: showCsmExtendedMetrics
      ? [RAQIV2Dimension.CsmTopic, RAQIV2Dimension.CsmResult]
      : [],
    breakdownDimensions: showCsmExtendedMetrics ? [RAQIV2Dimension.CsmTopic] : [],
    defaultBreakdown: [],
    body: showCsmExtendedMetrics
      ? [
          chartConfigMessagingServicePublishedMessagesCountExtended,
          chartConfigMessagingServiceReceivedMessagesCountExtended,
          chartConfigMessagingServiceMessageSizeBytes,
          chartConfigMessagingServiceFanoutRatioExtended,
          chartConfigMessagingServiceGameServersConnectedCount,
        ]
      : [
          chartConfigMessagingServicePublishedMessagesCount,
          chartConfigMessagingServiceReceivedMessagesCount,
          chartConfigMessagingServiceMessageSizeBytes,
          chartConfigMessagingServiceFanoutRatio,
          chartConfigMessagingServiceGameServersConnectedCount,
        ],
    hideHeroDivider: false,
  };
  return messagingServiceAnalyticsConfig;
};
const MessagingServiceAnalyticsContainer: FunctionComponent = () => {
  const { ready, value: showCsmExtendedMetrics } = useFlag(isCsmExtendedMetricsEnabled);
  if (!ready) {
    return <PageLoading />;
  }

  return <CreatorAnalyticsLayout config={getPageConfig(showCsmExtendedMetrics)} />;
};

export default withTranslation(MessagingServiceAnalyticsContainer, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.CloudServices,
]);
