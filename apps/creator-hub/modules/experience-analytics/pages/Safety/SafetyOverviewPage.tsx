import React, { useMemo } from 'react';
import {
  AnalyticsDocLink,
  ChartSummaryType,
  ChartType,
  DateRangeType,
  analyticsSafetyNavigationItem,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import {
  RAQIV2MetricGranularity,
  RAQIV2Dimension,
  RAQIV2Metric,
} from '@rbx/creator-hub-analytics-config';
import {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsUntabbedPageConfig,
  CreatorAnalyticsLayout,
  CreatorAnalyticsPageMode,
  AnalyticsComponentType,
  ChartConfig,
  ArbitraryComponentConfig,
  EndDateBehavior,
  RAQIV2SpecialLayoutType,
  RAQIV2SummaryType,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import AbuseReportSubmittersChart from './components/AbuseReportSubmittersChart';
import useGetAbuseReportSubmittersInsightConfigs from './hooks/useGetAbuseReportSubmittersInsightConfigs';

const safetyDocLink: AnalyticsDocLink = '/docs/safety';

const chartConfigTotalAbuseCategory = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Label.Metric.TotalAbuseReportsByCategory', TranslationNamespace.Safety),
  definitionTooltipKey: translationKey(
    'Description.TotalAbuseReportsByCategory',
    TranslationNamespace.Safety,
  ),
  metric: RAQIV2Metric.TotalAbuseReports,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.AbuseCategory],
    },
  },
  chartType: ChartType.Pie,
  summarySpec: {
    totalSummaryTypes: [],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [{ type: ChartSummaryType.TopBreakdown }],
  },
  labelDataAsPercent: true,
} as const satisfies ChartConfig;

const abuseReportChartConfig: ArbitraryComponentConfig = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [RAQIV2Metric.UniqueAbuseReportSubmittersPer1000PlaytimeHours],
  renderer: {
    type: 'withChartContext',
    render: (chartContext, onSelectChartRegion) => (
      <AbuseReportSubmittersChart
        chartContext={chartContext}
        onSelectChartRegion={onSelectChartRegion}
      />
    ),
  },
} as const satisfies ArbitraryComponentConfig;

const chartConfigUniqueServerShutdowns = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Chart.Title.ServerShutdownsByCategory', TranslationNamespace.Safety),
  definitionTooltipKey: translationKey(
    'Description.UniqueServerShutdowns',
    TranslationNamespace.Safety,
  ),
  metric: RAQIV2Metric.UniqueServerShutdowns,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.ViolationCategory],
    },
  },
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

const safetyTimeRangeOptions = {
  type: 'dateRange',
  supportedRanges: [
    DateRangeType.Last7Days,
    DateRangeType.Last28Days,
    DateRangeType.Last56Days,
    DateRangeType.Custom,
  ],
  defaultRange: DateRangeType.Last28Days,
} as const satisfies AnalyticsPageConfigDateOptions;

const safetySurfaceAnnotationOptions = {
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
  showAnnotationsControl: true,
} as const satisfies AnalyticsPageConfigAnnotationOptions;
const SafetyPageRAQIV2 = () => {
  const insightConfigs = useGetAbuseReportSubmittersInsightConfigs();
  const { isServerShutdownChartEnabled } = useFeatureFlagsForNamespace(
    'isServerShutdownChartEnabled',
    FeatureFlagNamespace.Analytics,
  );

  const safetyPageConfig: CreatorAnalyticsUntabbedPageConfig = useMemo(() => {
    const body = [...insightConfigs, abuseReportChartConfig, chartConfigTotalAbuseCategory];

    if (isServerShutdownChartEnabled) {
      body.push({
        type: RAQIV2SpecialLayoutType.FullWidthLayout,
        items: [chartConfigUniqueServerShutdowns],
      });
    }

    return {
      mode: CreatorAnalyticsPageMode.Untabbed,
      debugPageName: 'Safety',
      title: analyticsSafetyNavigationItem.title,
      description: {
        standard: translationKey('Description.TakeActionSafety', TranslationNamespace.Safety),
      },
      docLinks: [safetyDocLink],
      resourceTypes: [RAQIV2ChartResourceType.Universe],
      timeRangeOptions: safetyTimeRangeOptions,
      surfaceAnnotationOptions: safetySurfaceAnnotationOptions,
      granularity: { fixed: RAQIV2MetricGranularity.OneDay },
      breakdownDimensions: [],
      filterDimensions: [RAQIV2Dimension.AbuseChannel],
      body,
      endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
    };
  }, [insightConfigs, isServerShutdownChartEnabled]);

  return <CreatorAnalyticsLayout config={safetyPageConfig} />;
};
export default withTranslation(SafetyPageRAQIV2, [
  TranslationNamespace.Safety,
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
]);
