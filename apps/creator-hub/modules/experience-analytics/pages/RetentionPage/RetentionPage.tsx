import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import {
  analyticsRetentionNavigationItem,
  DateRangeType,
  AnalyticsDocLink,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  RAQIV2Dimension,
  RAQIV2UIPseudoDimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import React, { FunctionComponent, useMemo } from 'react';
import { withTranslation } from '@rbx/intl';
import {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsUntabbedPageConfig,
  CreatorAnalyticsPageMode,
  CreatorAnalyticsLayout,
  chartConfigDauMauStickiness,
  RAQIV2SpecialLayoutType,
  chartConfigForwardD1Retention,
  chartConfigForwardD7Retention,
  chartConfigForwardD30Retention,
  AnalyticsComponentType,
  EndDateBehavior,
  USER_SEGMENTATION_DIMENSIONS,
} from '@modules/experience-analytics-shared';
import useGetMetricsSummaryInsightConfigs from '@modules/analytics-assistant/hooks/useGetMetricsSummaryInsightConfigs';
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
      DateRangeType.Last7Days,
      DateRangeType.Last28Days,
      DateRangeType.Last56Days,
      DateRangeType.Last90Days,
      DateRangeType.Last365Days,
      DateRangeType.Custom,
    ],
    defaultRange: DateRangeType.Last56Days,
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
    defaultAnnotationTypes: [AnnotationType.Benchmark, AnnotationType.RetentionCorhortDisclaimer],
    showAnnotationsControl: true,
  } as const satisfies AnalyticsPageConfigAnnotationOptions,
  granularity: { fixed: RAQIV2MetricGranularity.OneDay },
  filterDimensions: [
    RAQIV2Dimension.AgeGroup,
    RAQIV2Dimension.Platform,
    RAQIV2Dimension.OperatingSystem,
    RAQIV2Dimension.Gender,
    RAQIV2Dimension.AcquisitionSource,
    RAQIV2UIPseudoDimension.TopCountries,
    RAQIV2UIPseudoDimension.TopLocales,
  ],
  breakdownDimensions: [
    RAQIV2Dimension.AgeGroup,
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
