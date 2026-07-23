import {
  AnnotationType,
  RAQIV2ChartResourceType,
  RecommendedEventType,
} from '@modules/clients/analytics';
import React, { useMemo } from 'react';
import {
  RAQIV2GenericPageErrorState,
  RAQIV2PredefinedChartKey,
  RAQIV2SpecialLayoutType,
  CreatorAnalyticsUntabbedPageConfig,
  CreatorAnalyticsLayout,
  getPredefinedComponentMetrics,
  useRAQIV2DimensionValuesRequest,
  useBestSupportedChartResourceOfTypes,
  TimeRangeType,
  TTimeRangeSpec,
  CreatorAnalyticsPageMode,
  GranularityConstraint,
  EndDateBehavior,
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
} from '@modules/experience-analytics-shared';
import { DateRangeType, AnalyticsDocLink } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import {
  RAQIV2AggregationType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { CircularProgress } from '@rbx/ui';

import useHasLiveEvents from '../useHasLiveEvents';
import { arbitraryComponentConfigRecommendedEventsLiveEventsButton } from '../Economy/economyPageComponentsConfig';
import {
  arbitraryComponentConfigCustomEventsNoEvents,
  arbitraryComponentConfigCustomEventsPopulatingEventsEmptyState,
  arbitraryComponentConfigCustomEventsTrackEventUpsell,
} from './customEventsPageComponentsConfig';

const customEventsBreakdownDimensions = [
  RAQIV2Dimension.CustomField1,
  RAQIV2Dimension.CustomField2,
  RAQIV2Dimension.CustomField3,
  RAQIV2Dimension.AgeGroup,
  RAQIV2Dimension.Gender,
  RAQIV2Dimension.OperatingSystem,
  RAQIV2Dimension.Platform,
  RAQIV2Dimension.PayerStatus,
  RAQIV2Dimension.IsNewUser,
] as const;

const customEventsLookBackSeconds = 60 * 60 * 24 * 90; // 90 days

const customEventsDocLink: AnalyticsDocLink = '/docs/production/analytics/custom-events';

const customEventsPageConfig: CreatorAnalyticsUntabbedPageConfig = {
  mode: CreatorAnalyticsPageMode.Untabbed,
  debugPageName: 'CustomEvents',
  docLinks: [customEventsDocLink],
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  // NOTE(shumingxu, 08/07/2024): This is different from the navigation item title, which is used for the sidebar
  title: translationKey('Title.CustomEvents', TranslationNamespace.Analytics),
  description: {
    standard: translationKey('Description.TakeActionCustomEvents', TranslationNamespace.Analytics),
  },
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
    excludeEndDateInRange: false,
    maxEndDateOffset: 0,
    maxStartDateOffsetDays: 365 * 2,
    maxRangeDays: 365 * 2 + 1,
  } as const satisfies AnalyticsPageConfigDateOptions,
  surfaceAnnotationOptions: {
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
  } as const satisfies AnalyticsPageConfigAnnotationOptions,
  granularity: {
    options: [
      RAQIV2MetricGranularity.OneHour,
      RAQIV2MetricGranularity.OneDay,
      RAQIV2MetricGranularity.OneWeek,
      RAQIV2MetricGranularity.OneMonth,
      RAQIV2MetricGranularity.None,
    ],
    constraints: {
      [RAQIV2MetricGranularity.OneHour]: GranularityConstraint.MOST_RECENT_SEVEN_DAYS,
    },
  },
  filterDimensions: [
    ...customEventsBreakdownDimensions,
    RAQIV2Dimension.CustomEventName,
    RAQIV2UIPseudoDimension.AggregationType,
  ],
  breakdownDimensions: customEventsBreakdownDimensions,
  defaultFilters: [
    { dimension: RAQIV2UIPseudoDimension.AggregationType, values: [RAQIV2AggregationType.Sum] },
  ],
  body: [
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [RAQIV2PredefinedChartKey.CustomEventsMigration],
    },
  ],
  preControlCharts: [arbitraryComponentConfigRecommendedEventsLiveEventsButton],
  preControlComponentDateRange: {
    type: TimeRangeType.Relative,
    lookbackSeconds: customEventsLookBackSeconds,
    granularity: RAQIV2MetricGranularity.None,
  }, // for custom event selector
};
const customEventsPageEmptyStateConfig: CreatorAnalyticsUntabbedPageConfig = {
  ...customEventsPageConfig,
  granularity: { fixed: RAQIV2MetricGranularity.OneDay },
  filterDimensions: [],
  breakdownDimensions: [],
  surfaceAnnotationOptions: {
    ...customEventsPageConfig.surfaceAnnotationOptions,
    showAnnotationsControl: false,
  },
  hideHeroDivider: true,
  endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
};

const customEventsPageWithNoDataAndNoLiveEventsConfig: CreatorAnalyticsUntabbedPageConfig = {
  ...customEventsPageEmptyStateConfig,
  body: [
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [arbitraryComponentConfigCustomEventsTrackEventUpsell],
    },
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [arbitraryComponentConfigCustomEventsNoEvents],
    },
  ],
};

const customEventsPagePopulatingDataConfig: CreatorAnalyticsUntabbedPageConfig = {
  ...customEventsPageEmptyStateConfig,
  body: [
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [arbitraryComponentConfigCustomEventsPopulatingEventsEmptyState],
    },
  ],
};

const CustomEventsPageContent = () => {
  const metrics = useMemo(
    () => customEventsPageConfig.body.map(getPredefinedComponentMetrics).flat(),
    [],
  );
  const resource = useBestSupportedChartResourceOfTypes(customEventsPageConfig.resourceTypes);
  const timeRangeSpec: TTimeRangeSpec = useMemo(
    () => ({
      type: TimeRangeType.Relative,
      lookbackSeconds: customEventsLookBackSeconds,
      granularity: RAQIV2MetricGranularity.OneDay,
    }),
    [],
  );
  const { data, isDataLoading, isResponseFailed, refresh } = useRAQIV2DimensionValuesRequest(
    resource,
    RAQIV2Dimension.CustomEventName,
    metrics,
    timeRangeSpec,
  );
  const { data: hasLiveEvents, isDataLoading: isHasLiveEventsLoading } = useHasLiveEvents(
    RecommendedEventType.CustomEvents,
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
      <RAQIV2GenericPageErrorState config={customEventsPageEmptyStateConfig} tryAgain={refresh} />
    );
  }

  if (!data?.values || data.values.length === 0) {
    if (isHasLiveEventsLoading) {
      return (
        <EmptyGrid>
          <CircularProgress data-testid='loading' />
        </EmptyGrid>
      );
    }

    if (hasLiveEvents) {
      // No custom events but has live events
      return <CreatorAnalyticsLayout config={customEventsPagePopulatingDataConfig} />;
    }

    // No custom events and no live events
    return <CreatorAnalyticsLayout config={customEventsPageWithNoDataAndNoLiveEventsConfig} />;
  }

  return <CreatorAnalyticsLayout config={customEventsPageConfig} />;
};

export default CustomEventsPageContent;
