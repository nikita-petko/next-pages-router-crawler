import React, { FunctionComponent } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsLayout,
  CreatorAnalyticsPageMode,
  CreatorAnalyticsUntabbedPageConfig,
} from '@modules/experience-analytics-shared';
import { DateRangeType, AnalyticsDocLink } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import {
  chartConfigMessagingServiceFanoutRatio,
  chartConfigMessagingServiceMessageSizeBytes,
  chartConfigMessagingServicePublishedMessagesCount,
  chartConfigMessagingServiceReceivedMessagesCount,
} from './messagingServiceChartConfigs';

const messagingServiceRateLimitsDocLink: AnalyticsDocLink =
  '/docs/reference/engine/classes/MessagingService';

const getPageConfig = (): CreatorAnalyticsUntabbedPageConfig => {
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
        DateRangeType.Last1Hour,
        DateRangeType.Last1Day,
        DateRangeType.Last7Days,
        DateRangeType.Custom,
      ],
      defaultRange: DateRangeType.Last1Day,
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
    },
    filterDimensions: [],
    breakdownDimensions: [],
    defaultBreakdown: [],
    body: [
      chartConfigMessagingServicePublishedMessagesCount,
      chartConfigMessagingServiceReceivedMessagesCount,
      chartConfigMessagingServiceMessageSizeBytes,
      chartConfigMessagingServiceFanoutRatio,
    ],
    hideHeroDivider: false,
  };
  return messagingServiceAnalyticsConfig;
};
const MessagingServiceAnalyticsContainer: FunctionComponent = () => {
  return <CreatorAnalyticsLayout config={getPageConfig()} />;
};

export default withTranslation(MessagingServiceAnalyticsContainer, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.CloudServices,
]);
