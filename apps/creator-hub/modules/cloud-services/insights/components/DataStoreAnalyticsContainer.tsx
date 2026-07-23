import type { FunctionComponent } from 'react';
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
import { getCurrentDate, subHours } from '@modules/charts-generic/utils/dateUtils';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import AnalyticsConfigChart from '@modules/experience-analytics-shared/components/RAQIV2/AnalyticsConfigChart';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import GenericAnalyticsLayoutItem from '@modules/experience-analytics-shared/components/RAQIV2/layout/GenericAnalyticsLayoutItem';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsUntabbedPageConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { CreatorAnalyticsPageMode } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import PageLoading from '@modules/miscellaneous/components/PageLoading';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { FeatureFlagName } from '@modules/settings/SettingsProvider/featureFlags';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import {
  chartConfigDataStoreRequestsByEndpoint,
  chartConfigDataStoreRequestsByStatus,
  chartConfigDataStoreStorageUsageBytes,
  controlledSubcontextConfigDataStoreRequestsByEndpointStatus,
  chartConfigDataStoreConsumedListRequestsBySource,
  chartConfigDataStoreConsumedReadRequests,
  chartConfigDataStoreConsumedReadRequestsBySource,
  chartConfigDataStoreConsumedRemoveRequests,
  chartConfigDataStoreConsumedRemoveRequestsBySource,
  chartConfigDataStoreConsumedWriteRequests,
  chartConfigDataStoreConsumedWriteRequestsBySource,
  chartConfigDataStoreConsumedListRequests,
  tabbedChartConfigDataStoreReadRequests,
  tabbedChartConfigDataStoreWriteRequests,
  tabbedChartConfigDataStoreListRequests,
  tabbedChartConfigDataStoreRemoveRequests,
} from './dataStoreChartConfigs';
import DataStoreRequestsByApiChart, {
  DataStoreRequestsByApiChartControlSpacer,
} from './DataStoreRequestsByApiChart';

const dataStoreObservabilityDocLink: AnalyticsDocLink =
  '/docs/cloud-services/data-stores/observability';
const dataStoreLimitsDocLink: AnalyticsDocLink = '/docs/cloud-services/data-stores#limits';

const getRequestSourceAnalyticsBody = (): NonNullable<
  CreatorAnalyticsUntabbedPageConfig['body']
> => [
  {
    type: RAQIV2SpecialLayoutType.SectionTitle,
    titleKey: translationKey('Title.ServerAccessUsage', TranslationNamespace.CloudServices),
  },
  {
    type: AnalyticsComponentType.NonGeneric,
    metrics: [RAQIV2Metric.DataStoreRequestsByEndpoint],
    renderer: {
      type: 'withChartContext',
      render: (chartContext, onSelectChartRegion) => (
        <DataStoreRequestsByApiChart
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
        />
      ),
    },
  },
  {
    type: AnalyticsComponentType.NonGeneric,
    metrics: [RAQIV2Metric.DataStoreRequestsByStatus],
    renderer: {
      type: 'withChartContext',
      render: (chartContext, onSelectChartRegion) => (
        <AnalyticsConfigChart
          chartKeyOrConfig={chartConfigDataStoreRequestsByStatus}
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
          chartControl={<DataStoreRequestsByApiChartControlSpacer />}
        />
      ),
    },
  },
  {
    type: RAQIV2SpecialLayoutType.FullWidthLayout,
    items: [controlledSubcontextConfigDataStoreRequestsByEndpointStatus],
  },
  {
    type: RAQIV2SpecialLayoutType.SectionTitle,
    titleKey: translationKey('Title.RequestTypeUsage', TranslationNamespace.CloudServices),
  },
  {
    type: RAQIV2SpecialLayoutType.FullWidthLayout,
    items: [chartConfigDataStoreConsumedReadRequestsBySource],
  },
  {
    type: RAQIV2SpecialLayoutType.FullWidthLayout,
    items: [chartConfigDataStoreConsumedWriteRequestsBySource],
  },
  {
    type: RAQIV2SpecialLayoutType.FullWidthLayout,
    items: [chartConfigDataStoreConsumedListRequestsBySource],
  },
  {
    type: RAQIV2SpecialLayoutType.FullWidthLayout,
    items: [chartConfigDataStoreConsumedRemoveRequestsBySource],
  },
];

const getLegacyDataStoreAnalyticsBody = (): NonNullable<
  CreatorAnalyticsUntabbedPageConfig['body']
> => [
  {
    type: RAQIV2SpecialLayoutType.SectionTitle,
    titleKey: translationKey('Title.AccessUsage', TranslationNamespace.CloudServices),
    description: [
      {
        key: translationKey('Description.IncompleteDataAlert', TranslationNamespace.CloudServices),
      },
    ],
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
];

const getPageConfig = (
  universeId: number,
  enableRequestSourceAnalytics: boolean,
): CreatorAnalyticsUntabbedPageConfig => {
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
        description: [
          {
            key: translationKey('Description.StorageDelayV2', TranslationNamespace.CloudServices),
            link: creatorHub.dashboard.getDataStoresManagerUrl(universeId),
          },
        ],
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
                    rangeType: RAQIV2DateRangeType.Custom,
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
      ...(enableRequestSourceAnalytics
        ? getRequestSourceAnalyticsBody()
        : getLegacyDataStoreAnalyticsBody()),
    ],
    hideHeroDivider: false,
  };
  return dataStoreAnalyticsConfig;
};
const DataStoreAnalyticsContainer: FunctionComponent = () => {
  const { id: universeId } = useUniverseResource();
  const { settings, isFetched } = useSettings();

  if (!isFetched) {
    return <PageLoading />;
  }

  const enableRequestSourceAnalytics =
    settings?.[FeatureFlagName.enableDataStoreRequestSourceAnalytics] ?? false;
  return (
    <CreatorAnalyticsLayout config={getPageConfig(universeId, enableRequestSourceAnalytics)} />
  );
};

export default withTranslation(DataStoreAnalyticsContainer, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.CloudServices,
]);
