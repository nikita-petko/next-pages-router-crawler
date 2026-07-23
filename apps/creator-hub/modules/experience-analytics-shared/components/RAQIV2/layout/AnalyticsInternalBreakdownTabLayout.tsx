import { useMemo } from 'react';
import type { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { Button, CircularProgress, Grid } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { AnalyticsPageLayout } from '@modules/charts-generic/layout/AnalyticsPageLayout';
import { EmptyGrid } from '@modules/miscellaneous/components';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getSingleDimensionBreakdownLabel } from '../../../adapters/genericRAQIV2ChartAdapter';
import { useBestSupportedChartResourceOfTypes } from '../../../hooks/useChartResourceProvider';
import useRAQIV2DimensionValuesRequest from '../../../hooks/useRAQIV2DimensionValuesRequest';
import useRAQIV2SortedDimensionValues from '../../../hooks/useRAQIV2SortedDimensionValues';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import useRAQIV2ValidatedBreakdownValues from '../../../hooks/useRAQIV2ValidatedBreakdownValues';
import NonConfigurationBasedExperienceAnalyticsTabbedPageLayout from '../../../layout/NonConfigurationBasedExperienceAnalyticsTabbedPageLayout';
import type {
  CreatorAnalyticsBreakdownTabPageConfig,
  CreatorAnalyticsUntabbedPageConfig,
} from '../../../types/RAQIV2PageConfig';
import { CreatorAnalyticsPageMode } from '../../../types/RAQIV2PageConfig';
import getPredefinedComponentMetrics from '../../../utils/getPredefinedComponentMetrics';
import AnalyticsInternalTabContentSurfaceLayout from './AnalyticsInternalTabContentSurfaceLayout';
import AnalyticsInternalUntabbedLayout from './AnalyticsInternalUntabbedLayout';
import useRAQIV2BreakdownTabPageContentStyles from './RAQIV2BreakdownTabPageContent.styles';
import RAQIV2PredefinedPageEligibilityCheckContext from './RAQIV2PredefinedPageEligbilityCheckContext';
import useDangerousRAQIV2PredefinedPreControlComponentsBundle from './useDangerousRAQIV2PredefinedPreControlComponentsBundle';
import useRAQIV2PredefinedPageControlsBundle from './useRAQIV2PredefinedPageControlsBundle';

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
    () => filteredTabDefinition.config.body.flatMap(getPredefinedComponentMetrics),
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
  const validatedBreakdownValues = useRAQIV2ValidatedBreakdownValues<TDim, TDimValues>(
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
            specOverride={filteredTabDefinition.getTabContextSpecOverride(value.value)}
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
        action={config.action}
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
        action={config.action}
        controls={[]}
        rightSideControls={[]}
        tabs={tabs}
        heroElement={preControlComponent ?? undefined}
        addHeroDivider={false}
        navigationItem={config.navigationItem}
      />
    </RAQIV2PredefinedPageEligibilityCheckContext>
  );
}

export default AnalyticsInternalBreakdownTabLayout;
