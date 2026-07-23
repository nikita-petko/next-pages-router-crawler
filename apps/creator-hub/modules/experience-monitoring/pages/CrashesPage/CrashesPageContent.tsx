import type { FC } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { withTranslation } from '@rbx/intl';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { analyticsCrashesNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import RAQIV2EligibilityChecker from '@modules/experience-analytics-shared/types/RAQIV2EligibilityChecker';
import {
  CreatorAnalyticsPageMode,
  EndDateBehavior,
  type AnalyticsPageConfigAnnotationOptions,
  type AnalyticsPageConfigDateOptions,
  type CreatorAnalyticsUntabbedPageConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CrashDumpsClientProvider from '../../components/crashes/CrashDumpsClientProvider';
import ServerMemoryDumpsContent from '../../components/crashes/ServerMemoryDumpsContent';
import ServerMemoryDumpsDataProvider from '../../components/crashes/ServerMemoryDumpsDataProvider';

const crashesPageConfig: CreatorAnalyticsUntabbedPageConfig = {
  mode: CreatorAnalyticsPageMode.Untabbed,
  debugPageName: 'Crashes',
  title: analyticsCrashesNavigationItem.title,
  description: {
    standard: translationKey('Description.CrashesPage', TranslationNamespace.Analytics),
  },
  docLinks: ['/docs/production/analytics/performance#server-charts'],
  eligibility: {
    checkerType: RAQIV2EligibilityChecker.PerformanceMonitoring,
    ineligibleMessage: translationKey(
      'Message.PerformanceChartsNoPermission',
      TranslationNamespace.Analytics,
    ),
    ignorePreControlComponents: true,
  },
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  timeRangeOptions: {
    type: 'dateRange',
    supportedRanges: [
      RAQIV2DateRangeType.Last1Hour,
      RAQIV2DateRangeType.Last1Day,
      RAQIV2DateRangeType.Last7Days,
      RAQIV2DateRangeType.Custom,
    ],
    defaultRange: RAQIV2DateRangeType.Last1Day,
    maxStartDateOffsetDays: 30,
    minStartDate: new Date('03/09/2026'),
  } as const satisfies AnalyticsPageConfigDateOptions,
  surfaceAnnotationOptions: {
    supportedAnnotationTypes: [
      AnnotationType.PlaceIcon,
      AnnotationType.PlaceThumbnail,
      AnnotationType.PlaceVideo,
      AnnotationType.PlaceVersion,
      AnnotationType.ConfigVersion,
      AnnotationType.EngineRelease,
      AnnotationType.Announcement,
    ],
    defaultAnnotationTypes: [AnnotationType.PlaceVersion, AnnotationType.EngineRelease],
    showAnnotationsControl: true,
  } as const satisfies AnalyticsPageConfigAnnotationOptions,
  granularity: {
    options: [
      RAQIV2MetricGranularity.OneDay,
      RAQIV2MetricGranularity.OneHour,
      RAQIV2MetricGranularity.HalfHour,
      RAQIV2MetricGranularity.OneMinute,
    ],
  },
  filterDimensions: [RAQIV2Dimension.Place],
  breakdownDimensions: [],
  body: [
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [
        {
          type: AnalyticsComponentType.Chart,
          titleKey: translationKey('Label.Metric.ServerCrashCount', TranslationNamespace.Analytics),
          definitionTooltipKey: translationKey(
            'Description.ServerCrashCount',
            TranslationNamespace.Analytics,
          ),
          metric: RAQIV2Metric.ServerCrashCount,
          overrides: {
            breakdown: {
              override: [RAQIV2Dimension.CrashType],
            },
          },
          chartType: ChartType.Spline,
        },
      ],
    },
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [
        {
          type: AnalyticsComponentType.NonGeneric,
          metrics: [RAQIV2Metric.ServerCrashCount],
          renderer: {
            type: 'withChartContext',
            render: (chartContext) => (
              <ServerMemoryDumpsDataProvider chartContext={chartContext}>
                <ServerMemoryDumpsContent />
              </ServerMemoryDumpsDataProvider>
            ),
          },
        },
      ],
    },
  ],
  endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
};
const CrashesPageContent: FC = () => {
  const { isLoading: isResourceLoading } = useUniverseResource();

  if (isResourceLoading) {
    return <PageLoading />;
  }

  return (
    <CrashDumpsClientProvider>
      <CreatorAnalyticsLayout config={crashesPageConfig} />
    </CrashDumpsClientProvider>
  );
};

export default withTranslation(CrashesPageContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.Navigation,
]);
