import type { ComponentProps, FC } from 'react';
import { useMemo } from 'react';
import { ChartAbnormalStatus, ChartStyleMode, SingleChartCardContainer } from '@rbx/analytics-ui';
import { Grid } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { getChartDefaultHeightByMode } from '@modules/charts-generic/charts/options';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ChartConfigOrPredefinedKey } from '../../constants/RAQIV2PredefinedChartConfig';
import { getNonMetricRelatedConfigFromPredefinedChart } from '../../constants/RAQIV2PredefinedChartConfig';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import type RAQIV2ChartContext from '../../types/RAQIV2ChartContext';

export enum AnalyticsConfigChartPlaceholderState {
  Loading = 'loading',
  NoData = 'no-data',
}

type AnalyticsConfigChartPlaceholderProps = {
  chartKeyOrConfig: ChartConfigOrPredefinedKey;
  chartContext: RAQIV2ChartContext;
  state: AnalyticsConfigChartPlaceholderState;
};

const chartLoadingState = {
  status: ChartAbnormalStatus.Loading,
} satisfies NonNullable<ComponentProps<typeof SingleChartCardContainer>['abnormalState']>;

const emptyChartSummarySpecs: ComponentProps<typeof SingleChartCardContainer>['chartSummarySpecs'] =
  [];

/**
 * Renders the configured chart shell without mounting the query-backed chart.
 * LastOption subcontexts use this while choices load or when no last option exists,
 * because mounting the real chart would issue an incomplete, unfiltered query.
 */
const AnalyticsConfigChartPlaceholder: FC<AnalyticsConfigChartPlaceholderProps> = ({
  chartKeyOrConfig,
  chartContext,
  state,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const chartConfig = useMemo(
    () => getNonMetricRelatedConfigFromPredefinedChart(chartKeyOrConfig),
    [chartKeyOrConfig],
  );
  const chartNoDataState = useMemo(
    () => ({
      status: ChartAbnormalStatus.NoData,
      description: translate(
        translationKey('Message.NoDataReturn', TranslationNamespace.Analytics),
      ),
    }),
    [translate],
  );
  const {
    chartHeight,
    chartStyleMode = ChartStyleMode.Normal,
    definitionTooltipKey,
    definitionTooltipKeyByGranularity,
    titleKey,
    titleKeyByGranularity,
    titleLabel,
  } = chartConfig;
  const effectiveTitleKey = titleKeyByGranularity?.[chartContext.granularity] ?? titleKey;
  const effectiveDefinitionTooltipKey =
    definitionTooltipKeyByGranularity?.[chartContext.granularity] ?? definitionTooltipKey;
  const resolvedChartHeight = chartHeight ?? getChartDefaultHeightByMode(chartStyleMode);
  const abnormalState =
    state === AnalyticsConfigChartPlaceholderState.Loading ? chartLoadingState : chartNoDataState;

  return (
    <Grid item XSmall={12} data-testid={`analytics-config-chart-${state}-placeholder`}>
      <SingleChartCardContainer
        // oxlint-disable-next-line typescript/prefer-nullish-coalescing -- Match the real chart's empty-title fallback.
        titleLabel={titleLabel || translate(effectiveTitleKey)}
        titleTooltipLabel={
          effectiveDefinitionTooltipKey ? translate(effectiveDefinitionTooltipKey) : undefined
        }
        chartSummarySpecs={emptyChartSummarySpecs}
        abnormalState={abnormalState}>
        <div style={{ height: resolvedChartHeight }} />
      </SingleChartCardContainer>
    </Grid>
  );
};

export default AnalyticsConfigChartPlaceholder;
