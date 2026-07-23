import type { FunctionComponent } from 'react';
import { useMemo } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import { withTranslation } from '@rbx/intl';
import useGetMetricsSummaryInsightConfigs from '@modules/analytics-assistant/hooks/useGetMetricsSummaryInsightConfigs';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsRetentionNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import {
  chartConfigDauMauStickiness,
  chartConfigForwardD1Retention,
  chartConfigForwardD30Retention,
  chartConfigForwardD7Retention,
} from '@modules/experience-analytics-shared/constants/chart-configs/PredefinedChartConfigLiterals';
import USER_SEGMENTATION_DIMENSIONS from '@modules/experience-analytics-shared/constants/UserSegmentationDimensions';
import {
  CreatorAnalyticsPageMode,
  EndDateBehavior,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsUntabbedPageConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import componentConfigCohortAnalysisTabbedTables from './CohortAnalysisTabbedTables';
import ForwardRetentionNUXBanner from './ForwardRetentionNUXBanner';

const retentionDocLink: AnalyticsDocLink = '/docs/production/analytics/retention';

const retentionPageConfig: CreatorAnalyticsUntabbedPageConfig = {
  mode: CreatorAnalyticsPageMode.Untabbed,
  debugPageName: 'Retention',
  docLinks: [retentionDocLink],
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  title: analyticsRetentionNavigationItem.title,
  description: {
    standard: translationKey('Description.TakeActionRetention', TranslationNamespace.Analytics),
  },
  preControlCharts: [
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [
        {
          type: AnalyticsComponentType.NonGeneric,
          metrics: [],
          renderer: {
            type: 'isolated',
            render: () => {
              return <ForwardRetentionNUXBanner />;
            },
          },
        },
      ],
      stylingOverride: {
        style: {
          paddingTop: 0,
        },
      },
    },
  ],
  timeRangeOptions: {
    type: 'dateRange',
    supportedRanges: [
      RAQIV2DateRangeType.Last7Days,
      RAQIV2DateRangeType.Last28Days,
      RAQIV2DateRangeType.Last56Days,
      RAQIV2DateRangeType.Last90Days,
      RAQIV2DateRangeType.Last365Days,
      RAQIV2DateRangeType.Custom,
    ],
    defaultRange: RAQIV2DateRangeType.Last56Days,
    excludeEndDateInRange: false,
    maxEndDateOffset: 0,
    maxStartDateOffsetDays: 365 * 2,
    maxRangeDays: 365 + 1,
  } as const satisfies AnalyticsPageConfigDateOptions,
  surfaceAnnotationOptions: {
    supportedAnnotationTypes: [
      AnnotationType.PlaceIcon,
      AnnotationType.PlaceThumbnail,
      AnnotationType.PlaceVideo,
      AnnotationType.PlaceVersion,
      AnnotationType.Benchmark,
      AnnotationType.LiveEvent,
      AnnotationType.RetentionCorhortDisclaimer,
      AnnotationType.ConfigVersion,
      AnnotationType.Announcement,
    ],
    // RetentionCorhortDisclaimer is intentionally NOT listed here: it is a
    // NotSelectableCategory annotation that auto-shows on forward-looking
    // retention charts via metric targeting, so it must not be written into the
    // annotations URL param as a default.
    defaultAnnotationTypes: [AnnotationType.Benchmark],
    showAnnotationsControl: true,
  } as const satisfies AnalyticsPageConfigAnnotationOptions,
  granularity: { fixed: RAQIV2MetricGranularity.OneDay },
  filterDimensions: [
    RAQIV2Dimension.AgeGroupV2,
    RAQIV2Dimension.Platform,
    RAQIV2Dimension.OperatingSystem,
    RAQIV2Dimension.Gender,
    RAQIV2Dimension.AcquisitionSource,
    RAQIV2UIPseudoDimension.TopCountries,
    RAQIV2UIPseudoDimension.TopLocales,
  ],
  breakdownDimensions: [
    RAQIV2Dimension.AgeGroupV2,
    RAQIV2Dimension.Platform,
    RAQIV2Dimension.OperatingSystem,
    RAQIV2Dimension.Gender,
    RAQIV2Dimension.AcquisitionSource,
    RAQIV2UIPseudoDimension.TopCountries,
    RAQIV2UIPseudoDimension.TopLocales,
  ],
  body: [
    chartConfigForwardD1Retention,
    chartConfigForwardD7Retention,
    chartConfigForwardD30Retention,
    chartConfigDauMauStickiness,
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [componentConfigCohortAnalysisTabbedTables],
    },
  ],
  hideHeroDivider: true,
  endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
};
const RetentionPageContent: FunctionComponent = () => {
  const metricsSummaryInsightConfigs = useGetMetricsSummaryInsightConfigs(retentionPageConfig);

  const pageConfig = useMemo(() => {
    const baseConfig = {
      ...retentionPageConfig,
      body: [...metricsSummaryInsightConfigs, ...retentionPageConfig.body],
    };

    const userSegmentationOverride: Partial<CreatorAnalyticsUntabbedPageConfig> = {
      filterDimensions: [...retentionPageConfig.filterDimensions, ...USER_SEGMENTATION_DIMENSIONS],
      breakdownDimensions: [
        ...retentionPageConfig.breakdownDimensions,
        ...USER_SEGMENTATION_DIMENSIONS,
      ],
    };

    return {
      ...baseConfig,
      ...userSegmentationOverride,
    };
  }, [metricsSummaryInsightConfigs]);

  return <CreatorAnalyticsLayout config={pageConfig} />;
};

export default withTranslation(RetentionPageContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
]);
