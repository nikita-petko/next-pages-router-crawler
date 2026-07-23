import React, { FunctionComponent } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import {
  // AnalyticsConfigChart, Might want this for full-width chart
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsLayout,
  CreatorAnalyticsPageMode,
  CreatorAnalyticsUntabbedPageConfig,
  // GenericAnalyticsLayoutItem, Might want this for full-width chart
  // RAQIV2ChartContext, Might want this for full-width chart
  // RAQIV2SpecialLayoutType, Might want this for full-width chart
  // AnalyticsComponentType, Might want this for full-width chart
  // useUniverseResource, Might want this for full-width chart
} from '@modules/experience-analytics-shared';
import {
  DateRangeType,
  // getCurrentDate, Might want this for full-width chart
  // subHours, Might want this for full-width chart
  AnalyticsDocLink,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import {
  RAQIV2Dimension,
  // RAQIV2Metric, Might want this for full-width chart
  RAQIV2MetricGranularity,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import {
  chartConfigHttpServiceRequestCount,
  chartConfigHttpServiceResponseTime,
} from './httpServiceChartConfigs';

const httpServiceObservabilityDocLink: AnalyticsDocLink =
  '/docs/cloud-services/http-service#observability';
const httpServiceLimitsDocLink: AnalyticsDocLink = '/docs/cloud-services/http-service#rate-limits';

const getPageConfig = (): CreatorAnalyticsUntabbedPageConfig => {
  const httpServiceAnalyticsConfig: CreatorAnalyticsUntabbedPageConfig = {
    mode: CreatorAnalyticsPageMode.Untabbed,
    debugPageName: 'HttpService',
    docLinks: [httpServiceObservabilityDocLink, httpServiceLimitsDocLink],
    resourceTypes: [RAQIV2ChartResourceType.Universe],
    title: translationKey('Heading.HttpService', TranslationNamespace.Analytics),
    description: {
      standard: translationKey(
        'Description.HttpServiceObservability',
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
      minStartDate: new Date('11/11/2025'),
    } as const satisfies AnalyticsPageConfigDateOptions,
    surfaceAnnotationOptions: {
      supportedAnnotationTypes: [
        AnnotationType.PlaceIcon,
        AnnotationType.PlaceThumbnail,
        AnnotationType.PlaceVideo,
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
    filterDimensions: [
      RAQIV2Dimension.Place,
      RAQIV2UIPseudoDimension.PercentileType,
      RAQIV2Dimension.HttpServiceMethod,
      RAQIV2Dimension.HttpServiceStatus,
    ],
    breakdownDimensions: [RAQIV2Dimension.HttpServiceMethod, RAQIV2Dimension.HttpServiceStatus],
    defaultBreakdown: [RAQIV2Dimension.HttpServiceMethod],
    body: [chartConfigHttpServiceRequestCount, chartConfigHttpServiceResponseTime],
    hideHeroDivider: false,
  };
  return httpServiceAnalyticsConfig;
};
const HttpServiceAnalyticsContainer: FunctionComponent = () => {
  return <CreatorAnalyticsLayout config={getPageConfig()} />;
};

export default withTranslation(HttpServiceAnalyticsContainer, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.CloudServices,
]);
