import type { FunctionComponent } from 'react';
import { useMemo } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
  RAQIV2PurchaseStatus,
} from '@rbx/creator-hub-analytics-config';
import { withTranslation } from '@rbx/intl';
import { Button, CircularProgress } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import CreatorAnalyticsLayout from '@modules/experience-analytics-shared/components/RAQIV2/layout/CreatorAnalyticsLayout';
import { useBestSupportedChartResourceOfTypes } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2DimensionValuesRequest from '@modules/experience-analytics-shared/hooks/useRAQIV2DimensionValuesRequest';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import AnalyticsTabContentLayout from '@modules/experience-analytics-shared/layout/AnalyticsTabContentLayout';
import ExperienceAnalyticsPageDateRangeControl from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/AnalyticsPageDateRangeControl';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsEmbeddedSurfaceConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { CreatorAnalyticsPageMode } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import getPredefinedComponentMetrics from '@modules/experience-analytics-shared/utils/getPredefinedComponentMetrics';
import { Asset } from '@modules/miscellaneous/common';
import { EmptyGrid } from '@modules/miscellaneous/components';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import Flex from '@modules/miscellaneous/components/Flex';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { tabbedChartConfigStoreAssetMonetization } from './assetAnalyticsChartConfigs';
import {
  summaryCardConfigStoreTotalGross,
  summaryCardConfigStoreTotalSold,
} from './assetAnalyticsSummaryCardConfigs';
import { tableConfigStoreAssetTransactions } from './assetAnalyticsTableConfigs';

const { dashboard } = creatorHub;

const assetDimensions = [
  RAQIV2Dimension.StoreItemId,
  RAQIV2Dimension.StoreItemType,
  RAQIV2Dimension.PurchaseStatus,
] as const;

const assetAnalyticsTabContentConfig: CreatorAnalyticsEmbeddedSurfaceConfig = {
  mode: CreatorAnalyticsPageMode.Embedded,
  resourceTypes: [RAQIV2ChartResourceType.User],
  timeRangeOptions: {
    type: 'dateRange',
    supportedRanges: [
      RAQIV2DateRangeType.Last7Days,
      RAQIV2DateRangeType.Last28Days,
      RAQIV2DateRangeType.Last56Days,
      RAQIV2DateRangeType.Last90Days,
      RAQIV2DateRangeType.Custom,
    ],
    defaultRange: RAQIV2DateRangeType.Last28Days,
    excludeEndDateInRange: false,
    maxEndDateOffset: 0,
    maxStartDateOffsetDays: 365,
  } as const satisfies AnalyticsPageConfigDateOptions,
  surfaceAnnotationOptions: {
    supportedAnnotationTypes: [],
    defaultAnnotationTypes: [],
    showAnnotationsControl: true,
  } as const satisfies AnalyticsPageConfigAnnotationOptions,
  granularity: { fixed: RAQIV2MetricGranularity.OneDay },
  filterDimensions: [],
  breakdownDimensions: assetDimensions,

  defaultBreakdown: [RAQIV2Dimension.StoreItemId],
  defaultFilters: [
    {
      dimension: RAQIV2Dimension.PurchaseStatus,
      values: [RAQIV2PurchaseStatus.Success],
    },
  ],
  body: [
    {
      type: RAQIV2SpecialLayoutType.RowLayout,
      items: [summaryCardConfigStoreTotalSold, summaryCardConfigStoreTotalGross],
    },
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [tabbedChartConfigStoreAssetMonetization, tableConfigStoreAssetTransactions],
    },
  ],
};

const AssetAnalyticsContent: FunctionComponent = () => {
  const { translate } = useRAQIV2TranslationDependencies();

  const metrics = useMemo(
    () => assetAnalyticsTabContentConfig.body.flatMap(getPredefinedComponentMetrics),
    [],
  );
  const resource = useBestSupportedChartResourceOfTypes(
    assetAnalyticsTabContentConfig.resourceTypes,
  );
  const { data, isDataLoading, isResponseFailed } = useRAQIV2DimensionValuesRequest(
    resource,
    RAQIV2Dimension.StoreItemId,
    metrics,
  );

  if (isDataLoading && !isResponseFailed) {
    return (
      <EmptyGrid>
        <CircularProgress data-testid='loading' />
      </EmptyGrid>
    );
  }

  if (!data?.values || data.values.length === 0) {
    return (
      <AnalyticsTabContentLayout
        controls={[<ExperienceAnalyticsPageDateRangeControl key='date' />]}
        forceNonStickyControlBar={false}>
        <Flex flexDirection='column' justifyContent='center' alignItems='center'>
          <EmptyState
            title={translate(
              translationKey('Heading.StoreZeroState', TranslationNamespace.StoreAnalytics),
            )}
            description={translate(
              translationKey('Description.StoreZeroState', TranslationNamespace.StoreAnalytics),
            )}
            size='small'
            illustration='analytics'>
            <Button
              size='large'
              variant='contained'
              color='primary'
              data-testid='zero-state-cta-button'
              href={dashboard.getUrl(undefined, Asset.Model)}>
              {translate(
                translationKey('Action.StoreZeroState', TranslationNamespace.StoreAnalytics),
              )}
            </Button>
          </EmptyState>
        </Flex>
      </AnalyticsTabContentLayout>
    );
  }

  return <CreatorAnalyticsLayout config={assetAnalyticsTabContentConfig} />;
};

export default withTranslation(AssetAnalyticsContent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.StoreAnalytics,
]);
