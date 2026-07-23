import { FunctionComponent } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import { urls } from '@modules/miscellaneous/common';
import {
  AnalyticsConfigChart,
  CreatorAnalyticsLayout,
  CreatorAnalyticsPageMode,
  CreatorAnalyticsUntabbedPageConfig,
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  GenericAnalyticsLayoutItem,
  RAQIV2ChartContext,
  RAQIV2SpecialLayoutType,
  AnalyticsComponentType,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import { DateRangeType, getCurrentDate, subHours, AnalyticsDocLink } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import {
  chartConfigDataStoreRequestsByEndpoint,
  chartConfigDataStoreRequestsByStatus,
  chartConfigDataStoreStorageUsageBytes,
  controlledSubcontextConfigDataStoreRequestsByEndpointStatus,
  tabbedChartConfigDataStoreReadRequests,
  tabbedChartConfigDataStoreWriteRequests,
  tabbedChartConfigDataStoreListRequests,
  tabbedChartConfigDataStoreRemoveRequests,
  chartConfigDataStoreConsumedReadRequests,
  chartConfigDataStoreConsumedWriteRequests,
  chartConfigDataStoreConsumedListRequests,
  chartConfigDataStoreConsumedRemoveRequests,
} from './dataStoreChartConfigs';

const dataStoreObservabilityDocLink: AnalyticsDocLink =
  '/docs/cloud-services/data-stores/observability';
const dataStoreLimitsDocLink: AnalyticsDocLink = '/docs/cloud-services/data-stores#limits';

const getPageConfig = (universeId: number): CreatorAnalyticsUntabbedPageConfig => {
  const dataStoreAnalyticsConfig: CreatorAnalyticsUntabbedPageConfig = {
    mode: CreatorAnalyticsPageMode.Untabbed,
    debugPageName: 'DataStores',
    docLinks: [dataStoreObservabilityDocLink, dataStoreLimitsDocLink],
    resourceTypes: [RAQIV2ChartResourceType.Universe],
    title: translationKey('Heading.DataStores', TranslationNamespace.Analytics),
    description: {
      standard: translationKey(
        'Description.DataStoresObservabilityV2',
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
        AnnotationType.PlaceVideo,
        AnnotationType.PlaceVersion,
        AnnotationType.LiveEvent,
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
    filterDimensions: [RAQIV2Dimension.DataStoreTypeV2],
    defaultFilters: [
      {
        dimension: RAQIV2Dimension.DataStoreTypeV2,
        values: ['Standard'],
      },
    ],
    breakdownDimensions: [],
    body: [
      {
        type: RAQIV2SpecialLayoutType.SectionTitle,
        titleKey: translationKey(
          'Title.DataStoreStorageUsageBytes',
          TranslationNamespace.CloudServices,
        ),
        description: {
          key: translationKey('Description.StorageDelayV2', TranslationNamespace.CloudServices),
          link: urls.creatorHub.dashboard.getDataStoresManagerUrl(universeId),
        },
      },
      {
        type: RAQIV2SpecialLayoutType.FullWidthLayout,
        items: [
          {
            type: AnalyticsComponentType.NonGeneric,
            metrics: [
              RAQIV2Metric.DataStoreStorageUsageBytes,
              RAQIV2Metric.DataStoreStorageQuotaBytes,
            ],
            renderer: {
              type: 'withChartContext',
              render: (chartContext, onSelectChartRegion) => {
                const currentTime = getCurrentDate();
                const { startTime } = chartContext.timeSpec;
                const endTime = subHours(currentTime, 4);
                const overrideContext: RAQIV2ChartContext = {
                  ...chartContext,
                  timeSpec: {
                    startTime,
                    endTime,
                  },
                  timeAxisBounds: [startTime, endTime],
                };
                return (
                  <GenericAnalyticsLayoutItem layout={RAQIV2SpecialLayoutType.FullWidthLayout}>
                    <AnalyticsConfigChart
                      chartKeyOrConfig={chartConfigDataStoreStorageUsageBytes}
                      chartContext={overrideContext}
                      onSelectChartRegion={onSelectChartRegion}
                    />
                  </GenericAnalyticsLayoutItem>
                );
              },
            },
          },
        ],
      },
      {
        type: RAQIV2SpecialLayoutType.SectionTitle,
        titleKey: translationKey('Title.AccessUsage', TranslationNamespace.CloudServices),
        description: {
          key: translationKey(
            'Description.IncompleteDataAlert',
            TranslationNamespace.CloudServices,
          ),
        },
      },
      chartConfigDataStoreRequestsByEndpoint,
      chartConfigDataStoreRequestsByStatus,
      {
        type: RAQIV2SpecialLayoutType.FullWidthLayout,
        items: [controlledSubcontextConfigDataStoreRequestsByEndpointStatus],
      },
      {
        type: RAQIV2SpecialLayoutType.SectionTitle,
        titleKey: translationKey('Title.RequestTypeUsage', TranslationNamespace.CloudServices),
      },
      tabbedChartConfigDataStoreReadRequests,
      chartConfigDataStoreConsumedReadRequests,
      tabbedChartConfigDataStoreWriteRequests,
      chartConfigDataStoreConsumedWriteRequests,
      tabbedChartConfigDataStoreListRequests,
      chartConfigDataStoreConsumedListRequests,
      tabbedChartConfigDataStoreRemoveRequests,
      chartConfigDataStoreConsumedRemoveRequests,
    ],
    hideHeroDivider: false,
  };
  return dataStoreAnalyticsConfig;
};
const DataStoreAnalyticsContainer: FunctionComponent = () => {
  const { id: universeId } = useUniverseResource();
  return <CreatorAnalyticsLayout config={getPageConfig(universeId)} />;
};

export default withTranslation(DataStoreAnalyticsContainer, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.CloudServices,
]);
