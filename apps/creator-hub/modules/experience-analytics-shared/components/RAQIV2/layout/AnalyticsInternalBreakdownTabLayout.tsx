import React, { useMemo } from 'react';

import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { Button, CircularProgress, Grid } from '@rbx/ui';
import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/common/components';
import { AnalyticsPageLayout } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getSingleDimensionBreakdownLabel } from '../../../adapters/genericRAQIV2ChartAdapter';
import getPredefinedComponentMetrics from '../../../utils/getPredefinedComponentMetrics';
import useRAQIV2SortedDimensionValues from '../../../hooks/useRAQIV2SortedDimensionValues';
import useRAQIV2ValidatedBreakdownValues from '../../../hooks/useRAQIV2ValidatedBreakdownValues';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import {
  CreatorAnalyticsBreakdownTabPageConfig,
  CreatorAnalyticsPageMode,
  CreatorAnalyticsUntabbedPageConfig,
} from '../../../types/RAQIV2PageConfig';
import useRAQIV2PredefinedPageControlsBundle from './useRAQIV2PredefinedPageControlsBundle';
import RAQIV2PredefinedPageEligibilityCheckContext from './RAQIV2PredefinedPageEligbilityCheckContext';
import useRAQIV2BreakdownTabPageContentStyles from './RAQIV2BreakdownTabPageContent.styles';
import useDangerousRAQIV2PredefinedPreControlComponentsBundle from './useDangerousRAQIV2PredefinedPreControlComponentsBundle';
import AnalyticsInternalUntabbedLayout from './AnalyticsInternalUntabbedLayout';
import NonConfigurationBasedExperienceAnalyticsTabbedPageLayout from '../../../layout/NonConfigurationBasedExperienceAnalyticsTabbedPageLayout';
import { useBestSupportedChartResourceOfTypes } from '../../../hooks/useChartResourceProvider';
import useRAQIV2DimensionValuesRequest from '../../../hooks/useRAQIV2DimensionValuesRequest';
import AnalyticsInternalTabContentSurfaceLayout from './AnalyticsInternalTabContentSurfaceLayout';

function AnalyticsInternalBreakdownTabLayout<
  TDim extends RAQIV2Dimension,
  TDimValues extends string,
>({ config }: { config: CreatorAnalyticsBreakdownTabPageConfig<TDim, TDimValues> }) {
  const {
    classes: { zeroStateMargin },
  } = useRAQIV2BreakdownTabPageContentStyles();
  const { tabBreakdownDimension, filteredTabDefinition, noTabEmptyState, tabBreakdownDateRange } =
    config;

  const { title, description } = useRAQIV2PredefinedPageControlsBundle(config);
  const { preControlComponent } = useDangerousRAQIV2PredefinedPreControlComponentsBundle(
    config.preTabCharts ?? [],
    config.filteredTabDefinition.config.resourceTypes,
  );
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate } = translationDependencies;

  const tabContextMetrics = useMemo(
    () => filteredTabDefinition.config.body.map(getPredefinedComponentMetrics).flat(),
    [filteredTabDefinition.config.body],
  );

  const resource = useBestSupportedChartResourceOfTypes(
    config.filteredTabDefinition.config.resourceTypes,
  );
  const { data, isDataLoading, isResponseFailed, refresh } = useRAQIV2DimensionValuesRequest(
    resource,
    tabBreakdownDimension,
    tabContextMetrics,
    tabBreakdownDateRange,
  );

  const sortedValues = useRAQIV2SortedDimensionValues(tabBreakdownDimension, data?.values ?? []);
  const validatedBreakdownValues = useRAQIV2ValidatedBreakdownValues(
    tabBreakdownDimension,
    sortedValues,
  );

  const tabs = useMemo(
    () =>
      validatedBreakdownValues.map((value) => ({
        key: value.value,
        label: getSingleDimensionBreakdownLabel(value, translationDependencies).name,
        content: (
          <AnalyticsInternalTabContentSurfaceLayout
            config={filteredTabDefinition.config}
            specOverride={filteredTabDefinition.getTabContextSpecOverride(
              value.value as TDimValues,
            )}
          />
        ),
      })),
    [validatedBreakdownValues, filteredTabDefinition, translationDependencies],
  );

  const noTabEmptyStateConfig: CreatorAnalyticsUntabbedPageConfig = useMemo(
    () => ({
      ...config,
      mode: CreatorAnalyticsPageMode.Untabbed,
      ...noTabEmptyState,
    }),
    [config, noTabEmptyState],
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
      <AnalyticsPageLayout
        title={title}
        description={description}
        heroElement={preControlComponent ?? undefined}
        addHeroDivider={false}>
        <Grid item XSmall={12} className={zeroStateMargin}>
          <EmptyStateBorder>
            <EmptyState
              title={translate(
                translationKey('Message.RequestFailure', TranslationNamespace.Analytics),
              )}
              size='small'>
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
        </Grid>
      </AnalyticsPageLayout>
    );
  }

  if (!tabs || tabs.length === 0) {
    return <AnalyticsInternalUntabbedLayout config={noTabEmptyStateConfig} />;
  }

  return (
    <RAQIV2PredefinedPageEligibilityCheckContext config={config}>
      <NonConfigurationBasedExperienceAnalyticsTabbedPageLayout
        title={title}
        description={description}
        controls={[]}
        rightSideControls={[]}
        tabs={tabs}
        heroElement={preControlComponent ?? undefined}
        addHeroDivider={false}
        navigationItem={config.navigationItem!}
      />
    </RAQIV2PredefinedPageEligibilityCheckContext>
  );
}

export default AnalyticsInternalBreakdownTabLayout;
