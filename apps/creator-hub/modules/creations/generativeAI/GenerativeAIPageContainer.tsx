import type { FunctionComponent } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { withTranslation } from '@rbx/intl';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsGenerativeAINavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import type { CreatorAnalyticsUntabbedPageConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { CreatorAnalyticsPageMode } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { analyticsComponentConfigGenerativeAISummary } from './analyticsComponentWrapperConfigs';
import {
  chartConfigCubeTotalRequests,
  chartConfigCubeDailyRequests,
  chartConfigCubeLatencyAvg,
  chartConfigCubeLatencyP99,
  chartConfigCubeOutcomes,
} from './generativeAIChartConfigs';

const generativeAIDocLink: AnalyticsDocLink = '/docs/assistant/ai-apis';

export const pageConfig: CreatorAnalyticsUntabbedPageConfig = {
  mode: CreatorAnalyticsPageMode.Untabbed,
  debugPageName: 'GenerativeAI',
  docLinks: [generativeAIDocLink],
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  title: analyticsGenerativeAINavigationItem.title,
  description: {
    standard: translationKey('Description.GenerativeAI', TranslationNamespace.Analytics),
  },
  granularity: {
    options: [RAQIV2MetricGranularity.OneDay],
  },
  filterDimensions: [RAQIV2Dimension.WorkflowType],
  breakdownDimensions: [],
  body: [
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [analyticsComponentConfigGenerativeAISummary],
    },
    {
      type: RAQIV2SpecialLayoutType.TwoPerRowLayout,
      items: [chartConfigCubeTotalRequests, chartConfigCubeDailyRequests],
    },
    {
      type: RAQIV2SpecialLayoutType.TwoPerRowLayout,
      items: [chartConfigCubeLatencyAvg, chartConfigCubeLatencyP99],
    },
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [chartConfigCubeOutcomes],
    },
  ],
  timeRangeOptions: {
    type: 'dateRange',
    supportedRanges: [
      RAQIV2DateRangeType.Last7Days,
      RAQIV2DateRangeType.Last28Days,
      RAQIV2DateRangeType.Custom,
    ],
    defaultRange: RAQIV2DateRangeType.Last7Days,
    maxRangeDays: 28,
    maxStartDateOffsetDays: 28,
  },
  surfaceAnnotationOptions: {
    supportedAnnotationTypes: [AnnotationType.Announcement],
    defaultAnnotationTypes: [],
    showAnnotationsControl: false,
  },
};

const GenerativeAIPageContainer: FunctionComponent = () => {
  return <CreatorAnalyticsLayout config={pageConfig} />;
};

export default withTranslation(GenerativeAIPageContainer, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.Navigation,
]);
