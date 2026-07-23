import React, { FunctionComponent, useMemo } from 'react';
import { withTranslation } from '@rbx/intl';

import { DateRangeType } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { Button, CircularProgress } from '@rbx/ui';

import { Asset, EmptyGrid, urls } from '@modules/miscellaneous/common';
import { EmptyState, Flex } from '@modules/miscellaneous/common/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import {
  RAQIV2PurchaseStatus,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';

import {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  AnalyticsTabContentLayout,
  ExperienceAnalyticsPageDateRangeControl,
  getPredefinedComponentMetrics,
  CreatorAnalyticsLayout,
  RAQIV2SpecialLayoutType,
  CreatorAnalyticsEmbeddedSurfaceConfig,
  useRAQIV2DimensionValuesRequest,
  useRAQIV2TranslationDependencies,
  useBestSupportedChartResourceOfTypes,
  CreatorAnalyticsPageMode,
} from '@modules/experience-analytics-shared';
import { tableConfigStoreAssetTransactions } from './assetAnalyticsTableConfigs';
import { tabbedChartConfigStoreAssetMonetization } from './assetAnalyticsChartConfigs';
import {
  summaryCardConfigStoreTotalGross,
  summaryCardConfigStoreTotalSold,
} from './assetAnalyticsSummaryCardConfigs';

const {
  creatorHub: { dashboard },
} = urls;

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
      DateRangeType.Last7Days,
      DateRangeType.Last28Days,
      DateRangeType.Last56Days,
      DateRangeType.Last90Days,
      DateRangeType.Custom,
    ],
    defaultRange: DateRangeType.Last28Days,
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
    () => assetAnalyticsTabContentConfig.body.map(getPredefinedComponentMetrics).flat(),
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
