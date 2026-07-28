import React from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import {
  OnboardingFeatureKey,
  OnboardingStepKey,
} from '@modules/experience-analytics-shared/constants/onboardingTipsConfigs';
import { RAQIV2SummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import RAQIV2FilterRenderPosition from '@modules/experience-analytics-shared/types/RAQIV2FilterRenderPosition';
import {
  CreatorAnalyticsPageMode,
  EndDateBehavior,
  type AnalyticsPageConfigAnnotationOptions,
  type AnalyticsPageConfigDateOptions,
  type CreatorAnalyticsFixedTabPageConfig,
  type CreatorAnalyticsPageSurfaceConfig,
  type CreatorAnalyticsUntabbedPageConfig,
  type TabbedRAQIV2PageTabConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CreateErrorReportRuleAction from './CreateErrorReportRuleAction';
import ErrorLogTableV2 from './ErrorLogTableV2';
import ErrorReportRulesTabContent from './ErrorReportRulesTabContent';

const errorReportDocLink = '/docs/production/analytics/error-report' as const;

enum ErrorReportTab {
  Reports = 'ErrorReport-Reports',
  Rules = 'ErrorReport-Rules',
}

const orderedTabKeys = [ErrorReportTab.Reports, ErrorReportTab.Rules] as const;
type TErrorReportTabKey = (typeof orderedTabKeys)[number];

const errorReportPageV2BaseFilterDimensions = [
  RAQIV2Dimension.Place,
  RAQIV2Dimension.PlaceVersion,
  RAQIV2Dimension.Keyword,
  RAQIV2Dimension.LogSeverity,
  RAQIV2Dimension.LogSource,
  RAQIV2Dimension.Platform,
  RAQIV2Dimension.OperatingSystem,
] as const;

const pageHeader = {
  debugPageName: 'ErrorReportV2',
  title: translationKey('Title.ErrorReport', TranslationNamespace.Analytics),
  description: {
    standard: translationKey('Description.ErrorReportPage', TranslationNamespace.Analytics),
  },
  docLinks: [errorReportDocLink],
};

const getReportsSurfaceConfig = (
  isErrorReportV2Enabled: boolean,
  isFirstSeenColumnEnabled: boolean,
  newPlaceVersionLiveBannerElement?: React.ReactElement,
): CreatorAnalyticsPageSurfaceConfig => ({
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  timeRangeOptions: {
    type: 'dateRange',
    supportedRanges: [
      RAQIV2DateRangeType.Last1Hour,
      RAQIV2DateRangeType.Last1Day,
      RAQIV2DateRangeType.Last7Days,
      RAQIV2DateRangeType.Last28Days,
      RAQIV2DateRangeType.Custom,
    ],
    defaultRange: RAQIV2DateRangeType.Last1Day,
    maxStartDateOffsetDays: 30,
  } as const satisfies AnalyticsPageConfigDateOptions,
  surfaceAnnotationOptions: {
    supportedAnnotationTypes: [
      AnnotationType.PlaceIcon,
      AnnotationType.PlaceThumbnail,
      AnnotationType.PlaceVideo,
      AnnotationType.PlaceVersion,
      AnnotationType.LiveEvent,
      AnnotationType.CreatorRegexChange,
    ],
    defaultAnnotationTypes: [AnnotationType.CreatorRegexChange],
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
  filterDimensions: [
    ...errorReportPageV2BaseFilterDimensions,
    ...(isErrorReportV2Enabled ? [RAQIV2Dimension.FirstSeenPlaceVersion] : []),
  ],
  filterPositionOverrides: isErrorReportV2Enabled
    ? {
        [RAQIV2Dimension.Place]: RAQIV2FilterRenderPosition.ControlsRow2,
        [RAQIV2Dimension.PlaceVersion]: RAQIV2FilterRenderPosition.ControlsRow2,
        [RAQIV2Dimension.FirstSeenPlaceVersion]: RAQIV2FilterRenderPosition.ControlsRow2,
      }
    : undefined,
  breakdownDimensions: [],
  preControlCharts:
    isErrorReportV2Enabled && newPlaceVersionLiveBannerElement
      ? [
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [
              {
                type: AnalyticsComponentType.NonGeneric,
                metrics: [],
                renderer: {
                  type: 'isolated',
                  render: () => newPlaceVersionLiveBannerElement,
                },
              },
            ],
          },
        ]
      : undefined,
  body: [
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [
        {
          type: AnalyticsComponentType.Chart,
          titleKey: translationKey('Title.ErrorReportChart', TranslationNamespace.Analytics),
          definitionTooltipKey: translationKey(
            'Description.ErrorReportChart',
            TranslationNamespace.Analytics,
          ),
          metric: RAQIV2Metric.ErrorCount,
          overrides: {
            breakdown: {
              override: [RAQIV2Dimension.LogSource],
            },
          },
          summarySpec: {
            totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
            perBreakdownSummaryTypes: [],
            aggregatedBreakdownSummaryTypes: [],
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
          metrics: [RAQIV2Metric.ErrorCount],
          renderer: {
            type: 'withChartContext',
            render: (chartContext) =>
              React.createElement(ErrorLogTableV2, {
                chartContext,
                isErrorReportV2Enabled,
                showFirstSeenColumn: isErrorReportV2Enabled && isFirstSeenColumnEnabled,
              }),
          },
        },
      ],
    },
  ],
  endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
});

const rulesTabConfig: TabbedRAQIV2PageTabConfig<TErrorReportTabKey> = {
  tabKey: ErrorReportTab.Rules,
  label: translationKey('Heading.Rules', TranslationNamespace.Navigation),
  onboardingTipsConfig: {
    featureKey: OnboardingFeatureKey.CreatorHubAnalyticsErrorReportRules,
    stepKey: OnboardingStepKey.ErrorReportRulesTab,
    isClosed: false,
  },
  action: React.createElement(CreateErrorReportRuleAction),
  description: {
    standard: translationKey('Description.ErrorReportRules', TranslationNamespace.Analytics),
  },
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  timeRangeOptions: { type: 'None' } as const satisfies AnalyticsPageConfigDateOptions,
  surfaceAnnotationOptions: {
    supportedAnnotationTypes: [],
    defaultAnnotationTypes: [],
    showAnnotationsControl: false,
  } as const satisfies AnalyticsPageConfigAnnotationOptions,
  filterDimensions: [],
  breakdownDimensions: [],
  body: [
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [
        {
          type: AnalyticsComponentType.NonGeneric,
          metrics: [],
          renderer: {
            type: 'isolated',
            render: () => React.createElement(ErrorReportRulesTabContent),
          },
        },
      ],
    },
  ],
};

export const getErrorReportPageV2Config = (
  isErrorReportV2Enabled: boolean,
  isFirstSeenColumnEnabled: boolean,
  newPlaceVersionLiveBannerElement?: React.ReactElement,
): CreatorAnalyticsFixedTabPageConfig<TErrorReportTabKey> | CreatorAnalyticsUntabbedPageConfig => {
  const reportsSurface = getReportsSurfaceConfig(
    isErrorReportV2Enabled,
    isFirstSeenColumnEnabled,
    newPlaceVersionLiveBannerElement,
  );

  // Only render the tabbed (Reports + Rules) layout when Error Report V2 is on.
  // Otherwise the page is a single, untabbed Reports surface with no tab bar.
  if (!isErrorReportV2Enabled) {
    return {
      ...pageHeader,
      mode: CreatorAnalyticsPageMode.Untabbed,
      ...reportsSurface,
    };
  }

  return {
    ...pageHeader,
    mode: CreatorAnalyticsPageMode.FixedTab,
    tabOrder: orderedTabKeys,
    tabs: {
      [ErrorReportTab.Reports]: {
        tabKey: ErrorReportTab.Reports,
        label: translationKey('Heading.Reports', TranslationNamespace.Navigation),
        ...reportsSurface,
      },
      [ErrorReportTab.Rules]: rulesTabConfig,
    },
  };
};
