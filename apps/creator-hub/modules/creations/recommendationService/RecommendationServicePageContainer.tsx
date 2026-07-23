import { AnalyticsDocLink, DateRangeType } from '@modules/charts-generic';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import React, { FunctionComponent, useMemo } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  RAQIV2GenericPageErrorState,
  CreatorAnalyticsLayout,
  CreatorAnalyticsPageMode,
  RAQIV2SpecialLayoutType,
  GranularityConstraint,
  CreatorAnalyticsUntabbedPageConfig,
  useRAQIV2DimensionValuesRequest,
  TimeRangeType,
  TTimeRangeSpec,
  useBestSupportedChartResourceOfTypes,
  getPredefinedComponentMetrics,
} from '@modules/experience-analytics-shared';
import { translationKey, withNamespaceSwitchedTranslation } from '@modules/analytics-translations';
import { RAQIV2MetricGranularity, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { CircularProgress } from '@rbx/ui';
import {
  summaryCardConfigUniqueUsers,
  summaryCardConfigTotalViewHours,
} from './recommendationServicePageSummaryCardConfigs';
import {
  chartConfigAverageViewTimePerUser,
  chartConfigNumItemsImpressedPerUser,
  chartConfigTotalActionsByActionType,
} from './recommendationServicePageChartConfigs';
import arbitraryComponentConfigRecommendationServiceEmptyState from './recommendationServicePageComponentConfigs';

const recommendationServiceDocLink: AnalyticsDocLink =
  '/docs/reference/engine/classes/RecommendationService';

const baseRecommendationServicePageConfig: Omit<
  CreatorAnalyticsUntabbedPageConfig,
  'defaultFilters'
> = {
  mode: CreatorAnalyticsPageMode.Untabbed,
  debugPageName: 'RecommendationService',
  docLinks: [recommendationServiceDocLink],
  title: translationKey(
    'Heading.RecommendationService',
    TranslationNamespace.RecommendationService,
  ),
  description: {
    standard: translationKey(
      'Description.RecommendationServiceDescription',
      TranslationNamespace.RecommendationService,
    ),
  },
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  granularity: {
    options: [
      RAQIV2MetricGranularity.OneHour,
      RAQIV2MetricGranularity.OneDay,
      RAQIV2MetricGranularity.OneWeek,
      RAQIV2MetricGranularity.OneMonth,
    ],
    constraints: {
      [RAQIV2MetricGranularity.OneHour]: GranularityConstraint.MOST_RECENT_SEVEN_DAYS,
    },
  },
  filterDimensions: [
    RAQIV2Dimension.LocationId,
    RAQIV2Dimension.ConfigName,
    RAQIV2Dimension.AgeGroup,
    RAQIV2Dimension.Gender,
    RAQIV2Dimension.OperatingSystem,
    RAQIV2Dimension.Platform,
  ],
  breakdownDimensions: [],
  timeRangeOptions: {
    type: 'dateRange',
    supportedRanges: [
      DateRangeType.Last1Day,
      DateRangeType.Last7Days,
      DateRangeType.Last28Days,
      DateRangeType.Last56Days,
      DateRangeType.Last90Days,
      DateRangeType.Last365Days,
      DateRangeType.Custom,
    ],
    defaultRange: DateRangeType.Last28Days,
    maxStartDateOffsetDays: 365 * 2,
    excludeEndDateInRange: false,
    maxEndDateOffset: 0,
    maxRangeDays: 365 * 2 + 1,
  },
  surfaceAnnotationOptions: {
    supportedAnnotationTypes: [AnnotationType.Announcement],
    defaultAnnotationTypes: [],
    showAnnotationsControl: true,
  },
  body: [
    {
      type: RAQIV2SpecialLayoutType.RowLayout,
      items: [summaryCardConfigUniqueUsers, summaryCardConfigTotalViewHours],
    },
    chartConfigAverageViewTimePerUser,
    chartConfigNumItemsImpressedPerUser,
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [chartConfigTotalActionsByActionType],
    },
  ],
};
const recommendationServiceEmptyStatePageConfig: CreatorAnalyticsUntabbedPageConfig = {
  ...baseRecommendationServicePageConfig,
  granularity: { fixed: RAQIV2MetricGranularity.OneDay },
  filterDimensions: [],
  breakdownDimensions: [],
  surfaceAnnotationOptions: {
    ...baseRecommendationServicePageConfig.surfaceAnnotationOptions,
    showAnnotationsControl: false,
  },
  hideHeroDivider: true,
  body: [
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [arbitraryComponentConfigRecommendationServiceEmptyState],
    },
  ],
};

const RecommendationServicePageContainer: FunctionComponent = () => {
  const metrics = useMemo(
    () => baseRecommendationServicePageConfig.body.map(getPredefinedComponentMetrics).flat(),
    [],
  );
  const resource = useBestSupportedChartResourceOfTypes(
    baseRecommendationServicePageConfig.resourceTypes,
  );
  const timeRangeSpec: TTimeRangeSpec = useMemo(
    () => ({
      type: TimeRangeType.Relative,
      lookbackSeconds: 60 * 60 * 24 * 90, // 90 days
      granularity: RAQIV2MetricGranularity.OneHour,
    }),
    [],
  );

  const { data, isDataLoading, isResponseFailed, refresh } = useRAQIV2DimensionValuesRequest(
    resource,
    RAQIV2Dimension.LocationId,
    metrics,
    timeRangeSpec,
  );

  if (isDataLoading && !isResponseFailed) {
    return (
      <EmptyGrid>
        <CircularProgress data-testid='loading' />
      </EmptyGrid>
    );
  }

  if (isResponseFailed) {
    return (
      <RAQIV2GenericPageErrorState
        config={recommendationServiceEmptyStatePageConfig}
        tryAgain={refresh}
      />
    );
  }

  if (!data?.values || data.values.length === 0) {
    return <CreatorAnalyticsLayout config={recommendationServiceEmptyStatePageConfig} />;
  }

  const recommendationServicePageConfig: CreatorAnalyticsUntabbedPageConfig = {
    ...baseRecommendationServicePageConfig,
    defaultFilters: data?.values?.[0]?.value
      ? [
          {
            dimension: RAQIV2Dimension.LocationId,
            values: [data.values[0].value],
            isInitialValueOnly: true,
          },
        ]
      : [],
  };

  return <CreatorAnalyticsLayout config={recommendationServicePageConfig} />;
};

export default withNamespaceSwitchedTranslation(RecommendationServicePageContainer, [
  TranslationNamespace.RecommendationService,
  TranslationNamespace.Analytics,
  TranslationNamespace.Error,
]);
