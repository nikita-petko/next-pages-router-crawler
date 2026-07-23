import { analyticsCrashesNavigationItem, ChartType, DateRangeType } from '@modules/charts-generic';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import React, { FC } from 'react';
import { useRouter } from 'next/router';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import {
  AnalyticsComponentType,
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsLayout,
  CreatorAnalyticsPageMode,
  CreatorAnalyticsUntabbedPageConfig,
  EndDateBehavior,
  RAQIV2EligibilityChecker,
  RAQIV2SpecialLayoutType,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import { PageLoading } from '@modules/miscellaneous/common';
import { translationKey } from '@modules/analytics-translations';
import {
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
  RAQIV2Metric,
} from '@rbx/creator-hub-analytics-config';
import ServerMemoryDumpsContent from '../../components/crashes/ServerMemoryDumpsContent';
import CrashDumpsClientProvider from '../../components/crashes/CrashDumpsClientProvider';
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
      DateRangeType.Last1Hour,
      DateRangeType.Last1Day,
      DateRangeType.Last7Days,
      DateRangeType.Custom,
    ],
    defaultRange: DateRangeType.Last1Day,
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
  const { isCrashesPageEnabled, isFetched: isFlagsReady } = useFeatureFlagsForNamespace(
    ['isCrashesPageEnabled'],
    FeatureFlagNamespace.Analytics,
  );

  const { isLoading: isResourceLoading } = useUniverseResource();
  const router = useRouter();

  if (isFlagsReady && !isResourceLoading) {
    if (isCrashesPageEnabled) {
      return (
        <CrashDumpsClientProvider>
          <CreatorAnalyticsLayout config={crashesPageConfig} />
        </CrashDumpsClientProvider>
      );
    }
    router.push('/404');
    return null;
  }

  return <PageLoading />;
};

export default withTranslation(CrashesPageContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.Navigation,
]);
