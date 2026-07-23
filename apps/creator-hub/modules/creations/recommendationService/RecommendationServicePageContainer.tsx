import type { FunctionComponent } from 'react';
import { useMemo } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { useTranslation } from '@rbx/intl';
import { Button, CircularProgress } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import { useBestSupportedChartResourceOfTypes } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2DimensionValuesRequest from '@modules/experience-analytics-shared/hooks/useRAQIV2DimensionValuesRequest';
import type TDateRangeSelection from '@modules/experience-analytics-shared/types/DateRangeSelection';
import { DateRangeSelectionType } from '@modules/experience-analytics-shared/types/DateRangeSelection';
import type { CreatorAnalyticsEmbeddedSurfaceConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { CreatorAnalyticsPageMode } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import getPredefinedComponentMetrics from '@modules/experience-analytics-shared/utils/getPredefinedComponentMetrics';
import { EmptyGrid } from '@modules/miscellaneous/components';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  chartConfigAverageViewTimePerUser,
  chartConfigNumItemsImpressedPerUser,
  chartConfigTotalActionsByActionType,
} from './recommendationServicePageChartConfigs';
import arbitraryComponentConfigRecommendationServiceEmptyState from './recommendationServicePageComponentConfigs';
import {
  summaryCardConfigUniqueUsers,
  summaryCardConfigTotalViewHours,
} from './recommendationServicePageSummaryCardConfigs';

export const recommendationServiceDocLink: AnalyticsDocLink =
  '/docs/reference/engine/classes/RecommendationService';

const baseRecommendationServicePageConfig: Omit<
  CreatorAnalyticsEmbeddedSurfaceConfig,
  'defaultFilters'
> = {
  mode: CreatorAnalyticsPageMode.Embedded,
  debugPageName: 'RecommendationService',
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  granularity: {
    options: [
      RAQIV2MetricGranularity.OneHour,
      RAQIV2MetricGranularity.OneDay,
      RAQIV2MetricGranularity.OneWeek,
      RAQIV2MetricGranularity.OneMonth,
    ],
    constraints: {
      [RAQIV2MetricGranularity.OneHour]: [{ type: 'freshness', startWithinDays: 7 }],
    },
  },
  filterDimensions: [
    RAQIV2Dimension.LocationId,
    RAQIV2Dimension.ConfigName,
    RAQIV2Dimension.AgeGroupV2,
    RAQIV2Dimension.Gender,
    RAQIV2Dimension.OperatingSystem,
    RAQIV2Dimension.Platform,
  ],
  breakdownDimensions: [],
  timeRangeOptions: {
    type: 'dateRange',
    supportedRanges: [
      RAQIV2DateRangeType.Last1Day,
      RAQIV2DateRangeType.Last7Days,
      RAQIV2DateRangeType.Last28Days,
      RAQIV2DateRangeType.Last56Days,
      RAQIV2DateRangeType.Last90Days,
      RAQIV2DateRangeType.Custom,
    ],
    defaultRange: RAQIV2DateRangeType.Last28Days,
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
const recommendationServiceEmptyStatePageConfig: CreatorAnalyticsEmbeddedSurfaceConfig = {
  ...baseRecommendationServicePageConfig,
  granularity: { fixed: RAQIV2MetricGranularity.OneDay },
  filterDimensions: [],
  breakdownDimensions: [],
  surfaceAnnotationOptions: {
    ...baseRecommendationServicePageConfig.surfaceAnnotationOptions,
    showAnnotationsControl: false,
  },
  body: [
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [arbitraryComponentConfigRecommendationServiceEmptyState],
    },
  ],
};

const RecommendationServicePageContainer: FunctionComponent = () => {
  const { translate } = useTranslationWrapper(useTranslation());
  const metrics = useMemo(
    () => baseRecommendationServicePageConfig.body.flatMap(getPredefinedComponentMetrics),
    [],
  );
  const resource = useBestSupportedChartResourceOfTypes(
    baseRecommendationServicePageConfig.resourceTypes,
  );
  const dateRangeSelection: TDateRangeSelection = useMemo(
    () => ({
      type: DateRangeSelectionType.Preset,
      rangeType: RAQIV2DateRangeType.Last90Days,
      granularity: RAQIV2MetricGranularity.OneHour,
    }),
    [],
  );

  const { data, isDataLoading, isResponseFailed, refresh } = useRAQIV2DimensionValuesRequest(
    resource,
    RAQIV2Dimension.LocationId,
    metrics,
    dateRangeSelection,
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
      <EmptyGrid>
        <EmptyStateBorder>
          <EmptyState
            title={translate(
              translationKey('Message.RequestFailure', TranslationNamespace.Analytics),
            )}
            size='large'>
            <Button
              size='medium'
              variant='contained'
              color='primary'
              data-testid='empty-state-cta-button'
              onClick={refresh}>
              {translate(
                translationKey('EmptyState.Action.TryAgain', TranslationNamespace.Analytics),
              )}
            </Button>
          </EmptyState>
        </EmptyStateBorder>
      </EmptyGrid>
    );
  }

  if (!data?.values || data.values.length === 0) {
    return <CreatorAnalyticsLayout config={recommendationServiceEmptyStatePageConfig} />;
  }

  const recommendationServicePageConfig: CreatorAnalyticsEmbeddedSurfaceConfig = {
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
