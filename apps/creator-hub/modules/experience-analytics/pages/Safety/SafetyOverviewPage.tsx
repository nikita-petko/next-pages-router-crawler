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
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { analyticsSafetyNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import ChartSummaryType from '@modules/charts-generic/enums/ChartSummaryType';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import { RAQIV2SummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import {
  CreatorAnalyticsPageMode,
  EndDateBehavior,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsUntabbedPageConfig,
  RAQIV2UIComponent,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
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
    RAQIV2DateRangeType.Last7Days,
    RAQIV2DateRangeType.Last28Days,
    RAQIV2DateRangeType.Last56Days,
    RAQIV2DateRangeType.Custom,
  ],
  defaultRange: RAQIV2DateRangeType.Last28Days,
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

  const safetyPageConfig: CreatorAnalyticsUntabbedPageConfig = useMemo(() => {
    const body: RAQIV2UIComponent[] = [
      ...insightConfigs,
      abuseReportChartConfig,
      chartConfigTotalAbuseCategory,
      {
        type: RAQIV2SpecialLayoutType.FullWidthLayout,
        items: [chartConfigUniqueServerShutdowns],
      },
    ];

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
  }, [insightConfigs]);

  return <CreatorAnalyticsLayout config={safetyPageConfig} />;
};
export default withTranslation(SafetyPageRAQIV2, [
  TranslationNamespace.Safety,
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
]);
