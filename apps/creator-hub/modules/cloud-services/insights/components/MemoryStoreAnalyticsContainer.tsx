import type { FunctionComponent } from 'react';
import { useMemo } from 'react';
import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Alert, AlertTitle } from '@rbx/ui';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useIsAboveAndEqualToDAUThreshold from '@modules/experience-analytics-shared/hooks/useIsAboveAndEqualToDAUThreshold';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsUntabbedPageConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { CreatorAnalyticsPageMode } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  chartConfigMemoryStoreMemoryUsageBytes,
  tabbedChartConfigMemoryStoreRequestUnitsByEndpoint,
  chartConfigMemoryStoreRequestsByEndpoint,
  chartConfigMemoryStoreRequestsByStatus,
  controlledSubcontextConfigMemoryStoreRequestsByApiStatus,
} from './memoryStoreChartConfigs';

const memoryStoreObservabilityDocLink: AnalyticsDocLink =
  '/docs/cloud-services/memory-stores/observability';
const memoryStoreLimitsDocLink: AnalyticsDocLink =
  '/docs/cloud-services/memory-stores#limits-and-quotas';
const memoryStoreNotifactionAlerts: AnalyticsDocLink =
  '/docs/cloud-services/memory-stores/observability#notification-alerts';

const memoryStoreTimeRangeOptions = {
  type: 'dateRange',
  supportedRanges: [
    RAQIV2DateRangeType.Last1Hour,
    RAQIV2DateRangeType.Last1Day,
    RAQIV2DateRangeType.Last7Days,
    RAQIV2DateRangeType.Custom,
  ],
  defaultRange: RAQIV2DateRangeType.Last1Day,
} as const satisfies AnalyticsPageConfigDateOptions;

const memoryStoreSurfaceAnnotationOptions = {
  supportedAnnotationTypes: [
    AnnotationType.PlaceIcon,
    AnnotationType.PlaceThumbnail,
    AnnotationType.PlaceVideo,
    AnnotationType.PlaceVersion,
    AnnotationType.LiveEvent,
    AnnotationType.ConfigVersion,
    AnnotationType.Announcement,
  ],
  defaultAnnotationTypes: [
    AnnotationType.MemoryStoreMemoryUsageAlert,
    AnnotationType.MemoryStoreRequestsAlert,
  ],
  showAnnotationsControl: false,
} as const satisfies AnalyticsPageConfigAnnotationOptions;
const DAU_THRESHOLD = 10;

const MemoryStoreAnalyticsContainer: FunctionComponent = () => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { id: universeId } = useUniverseResource();
  const { isAboveAndEqualToDAUThreshold, isLoadingDAU } = useIsAboveAndEqualToDAUThreshold(
    universeId,
    DAU_THRESHOLD,
  );

  // Show banner if DAU is below threshold
  const showBreakdownAvailabilityBanner = !isLoadingDAU && !isAboveAndEqualToDAUThreshold;

  const breakdownAvailabilityBannerConfig = useMemo(
    () => ({
      type: AnalyticsComponentType.NonGeneric as const,
      metrics: [],
      renderer: {
        type: 'isolated' as const,
        render: () => (
          <Alert variant='outlined' severity='info'>
            <AlertTitle>
              {translate(
                translationKey(
                  'Heading.MemoryStoresBreakdownAvailability',
                  TranslationNamespace.CloudServices,
                ),
              )}
            </AlertTitle>
            {translate(
              translationKey(
                'Description.MemoryStoresBreakdownAvailability',
                TranslationNamespace.CloudServices,
              ),
            )}
          </Alert>
        ),
      },
    }),
    [translate],
  );

  const pageConfig: CreatorAnalyticsUntabbedPageConfig = useMemo(
    () => ({
      mode: CreatorAnalyticsPageMode.Untabbed,
      debugPageName: 'MemoryStores',
      docLinks: [
        memoryStoreNotifactionAlerts,
        memoryStoreObservabilityDocLink,
        memoryStoreLimitsDocLink,
      ],
      resourceTypes: [RAQIV2ChartResourceType.Universe],
      title: translationKey('Heading.MemoryStores', TranslationNamespace.Analytics),
      description: {
        standard: translationKey(
          'Description.MemoryStoresObservabilityV3',
          TranslationNamespace.CloudServices,
        ),
      },
      timeRangeOptions: memoryStoreTimeRangeOptions,
      surfaceAnnotationOptions: memoryStoreSurfaceAnnotationOptions,
      granularity: {
        options: [
          RAQIV2MetricGranularity.HalfHour,
          RAQIV2MetricGranularity.OneHour,
          RAQIV2MetricGranularity.OneDay,
          RAQIV2MetricGranularity.OneMinute,
        ],
      },
      filterDimensions: [],
      defaultFilters: [],
      breakdownDimensions: [],
      body: [
        {
          type: RAQIV2SpecialLayoutType.FullWidthLayout,
          items: [
            ...(showBreakdownAvailabilityBanner ? [breakdownAvailabilityBannerConfig] : []),
            chartConfigMemoryStoreMemoryUsageBytes,
            tabbedChartConfigMemoryStoreRequestUnitsByEndpoint,
            chartConfigMemoryStoreRequestsByEndpoint,
            chartConfigMemoryStoreRequestsByStatus,
            controlledSubcontextConfigMemoryStoreRequestsByApiStatus,
          ],
        },
      ],
      hideHeroDivider: false,
    }),
    [showBreakdownAvailabilityBanner, breakdownAvailabilityBannerConfig],
  );

  return <CreatorAnalyticsLayout config={pageConfig} />;
};

export default withTranslation(MemoryStoreAnalyticsContainer, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.CloudServices,
]);
