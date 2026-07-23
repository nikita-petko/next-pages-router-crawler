import type { FunctionComponent } from 'react';
import { useMemo } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { withTranslation } from '@rbx/intl';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import AnalyticsConfigChart from '@modules/experience-analytics-shared/components/RAQIV2/AnalyticsConfigChart';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import GenericAnalyticsLayoutItem from '@modules/experience-analytics-shared/components/RAQIV2/layout/GenericAnalyticsLayoutItem';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsUntabbedPageConfig,
  RAQIV2UIComponent,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import {
  CreatorAnalyticsPageMode,
  EndDateBehavior,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useGetVideoServiceExtendedServicesInsightConfigs from '../hooks/useGetVideoServiceExtendedServicesInsightConfigs';
import {
  chartConfigVideoServicePlaybackSeconds,
  chartConfigVideoServicePlaybackSecondsByPlaybackType,
} from './videoServiceChartConfigs';

const videoServiceDocLink: AnalyticsDocLink = '/docs/cloud-services/video-service';

const getPageConfig = (
  insightConfigs: RAQIV2UIComponent[] = [],
): CreatorAnalyticsUntabbedPageConfig => {
  const videoServiceAnalyticsConfig: CreatorAnalyticsUntabbedPageConfig = {
    mode: CreatorAnalyticsPageMode.Untabbed,
    debugPageName: 'VideoService',
    docLinks: [videoServiceDocLink],
    resourceTypes: [RAQIV2ChartResourceType.Universe],
    title: translationKey('Heading.VideoService', TranslationNamespace.Analytics),
    description: {
      standard: translationKey(
        'Description.VideoServiceObservability',
        TranslationNamespace.Analytics,
      ),
    },
    timeRangeOptions: {
      type: 'dateRange',
      supportedRanges: [
        RAQIV2DateRangeType.Last1Hour,
        RAQIV2DateRangeType.Last1Day,
        RAQIV2DateRangeType.Last7Days,
        RAQIV2DateRangeType.Last28Days,
        RAQIV2DateRangeType.Custom,
      ],
      defaultRange: RAQIV2DateRangeType.Last28Days,
    } as const satisfies AnalyticsPageConfigDateOptions,
    // Cap the chart/date-range end at each metric's latest available time
    // (from CAaaS metadata) instead of "now", so the still-accumulating most
    // recent bucket is not drawn as a misleadingly low data point.
    endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
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
    // Only Place is user-filterable. VideoType (uploaded-videos scope) and
    // PlaybackSegment (breakdown) are applied permanently via chart-level
    // overrides, so they are not exposed as filter or breakdown controls.
    filterDimensions: [RAQIV2Dimension.Place],
    breakdownDimensions: [],
    body: [
      // The Extended Services recommendation card is prepended when the insight
      // is active for the universe; otherwise this spreads to nothing.
      ...insightConfigs,
      {
        type: RAQIV2SpecialLayoutType.TwoPerRowLayout,
        items: [
          chartConfigVideoServicePlaybackSecondsByPlaybackType,
          {
            type: AnalyticsComponentType.NonGeneric,
            metrics: [RAQIV2Metric.VideoServiceExclusivePlaybackSeconds],
            renderer: {
              type: 'withChartContext',
              render: (chartContext, onSelectChartRegion) => (
                <GenericAnalyticsLayoutItem layout={RAQIV2SpecialLayoutType.FullWidthLayout}>
                  <AnalyticsConfigChart
                    chartKeyOrConfig={chartConfigVideoServicePlaybackSeconds}
                    chartContext={chartContext}
                    onSelectChartRegion={onSelectChartRegion}
                    displayOptions={{
                      // The chart is always broken down by PlaybackSegment, so
                      // hide the aggregate total and show the per-segment lines.
                      hideTotalSeriesInChart: true,
                    }}
                  />
                </GenericAnalyticsLayoutItem>
              ),
            },
          },
        ],
      },
    ],
    hideHeroDivider: false,
  };
  return videoServiceAnalyticsConfig;
};

const VideoServiceAnalyticsContainer: FunctionComponent = () => {
  const insightConfigs = useGetVideoServiceExtendedServicesInsightConfigs();
  const config = useMemo(() => getPageConfig(insightConfigs), [insightConfigs]);
  return <CreatorAnalyticsLayout config={config} />;
};

export default withTranslation(VideoServiceAnalyticsContainer, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.CloudServices,
  TranslationNamespace.Insights,
]);
