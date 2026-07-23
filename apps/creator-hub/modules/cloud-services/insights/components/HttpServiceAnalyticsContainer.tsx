import type { FunctionComponent } from 'react';
import {
  // RAQIV2Metric, Might want this for full-width chart
  RAQIV2MetricGranularity,
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import { withTranslation } from '@rbx/intl';
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
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  chartConfigHttpServiceRequestCountExtended,
  chartConfigHttpServiceResponseTimeExtended,
} from './httpServiceChartConfigs';

const httpServiceObservabilityDocLink: AnalyticsDocLink =
  '/docs/cloud-services/http-service#observability';
const httpServiceLimitsDocLink: AnalyticsDocLink = '/docs/cloud-services/http-service#rate-limits';

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
      RAQIV2DateRangeType.Last1Hour,
      RAQIV2DateRangeType.Last1Day,
      RAQIV2DateRangeType.Last7Days,
      RAQIV2DateRangeType.Custom,
    ],
    defaultRange: RAQIV2DateRangeType.Last1Day,
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
    RAQIV2Dimension.HttpServiceDomainsExtended,
  ],
  breakdownDimensions: [
    RAQIV2Dimension.HttpServiceMethod,
    RAQIV2Dimension.HttpServiceStatus,
    RAQIV2Dimension.HttpServiceDomainsExtended,
  ],
  defaultBreakdown: [RAQIV2Dimension.HttpServiceMethod],
  body: [chartConfigHttpServiceRequestCountExtended, chartConfigHttpServiceResponseTimeExtended],
  hideHeroDivider: false,
};

const HttpServiceAnalyticsContainer: FunctionComponent = () => {
  return <CreatorAnalyticsLayout config={httpServiceAnalyticsConfig} />;
};

export default withTranslation(HttpServiceAnalyticsContainer, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.CloudServices,
]);
