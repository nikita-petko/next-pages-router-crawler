import type { FC } from 'react';
import { useMemo, useEffect } from 'react';
import { Grid } from '@rbx/ui';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { shouldShowComparison } from '../../adapters/genericRAQIV2ChartSummaryAdapter';
import type { RAQIV2SummarySpec } from '../../adapters/genericRAQIV2ChartSummaryAdapter';
import type { ChartConfigOrPredefinedKey } from '../../constants/RAQIV2PredefinedChartConfig';
import {
  getChartTypeFromPredefinedChart,
  getMetricRelatedConfigFromPredefinedChart,
  getNonMetricRelatedConfigFromPredefinedChart,
  getQuotaConfigFromPredefinedChart,
  getOverlays,
  getDisplayOptions,
} from '../../constants/RAQIV2PredefinedChartConfig';
import type RAQIV2PredefinedChartKey from '../../constants/RAQIV2PredefinedChartKey';
import useCurrentAnnotationsBundleProvider from '../../hooks/useCurrentAnnotationsBundleProvider';
import useRAQIV2PredefinedWarnings from '../../hooks/useRAQIV2PredefinedWarnings';
import type GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import type RAQIV2ChartContext from '../../types/RAQIV2ChartContext';
import computeRAQIV2SpecOverride from '../../utils/computeRAQIV2SpecOverride';
import getUniqueKeyForAnalyticsComponent from '../../utils/getUniqueKeyForAnalyticsComponent';
import resolveComparisonConfig from '../../utils/resolveComparisonConfig';
import { useAnalyticsChartContainerDragDropContext } from './layout/AnalyticsChartContainerDragDropContext';
import SortableAnalyticsChartContainer from './layout/SortableAnalyticsChartContainer';
import type { RAQIV2GenericChartProps } from './RAQIV2GenericChart';
import RAQIV2GenericChart from './RAQIV2GenericChart';

export type AnalyticsConfigChartProps = {
  chartKeyOrConfig: ChartConfigOrPredefinedKey;
  predefinedChartKeyForAssistant?: RAQIV2PredefinedChartKey;
  chartContext: RAQIV2ChartContext;
  breakdownSummaryFilterOverride?: RAQIV2SummarySpec['breakdownSummaryFilter'];
} & Omit<GenericRAQIV2ChartProps, 'spec' | 'footerProps' | 'chartWarnings'>;

// Single chart component for predefined RAQI V2 charts
const AnalyticsConfigChart: FC<AnalyticsConfigChartProps> = ({
  chartKeyOrConfig,
  chartContext,
  comparison,
  breakdownSummaryFilterOverride,
  ...chartProps
}) => {
  const partialPredefinedChartConfig = useMemo(
    () => getNonMetricRelatedConfigFromPredefinedChart(chartKeyOrConfig),
    [chartKeyOrConfig],
  );
  const {
    summarySpec,
    titleKeyByGranularity,
    definitionTooltipKeyByGranularity,
    titleKey,
    definitionTooltipKey,
    comparison: predefinedComparison,
    ...predefinedProps
  } = partialPredefinedChartConfig;
  const predefinedOverlays = getOverlays(partialPredefinedChartConfig);
  const predefinedDisplayOptions = getDisplayOptions(partialPredefinedChartConfig);
  const metricConfigs = useMemo(
    () => getMetricRelatedConfigFromPredefinedChart(chartKeyOrConfig),
    [chartKeyOrConfig],
  );
  const effectiveSummarySpec = useMemo(
    () =>
      summarySpec && breakdownSummaryFilterOverride
        ? {
            ...summarySpec,
            breakdownSummaryFilter: {
              ...summarySpec.breakdownSummaryFilter,
              ...breakdownSummaryFilterOverride,
            },
          }
        : summarySpec,
    [breakdownSummaryFilterOverride, summarySpec],
  );

  const chartSpecs = useMemo(() => {
    return metricConfigs.map(({ metric, overrides }) => {
      return computeRAQIV2SpecOverride({ ...chartContext, metric }, overrides);
    });
  }, [chartContext, metricConfigs]);

  const chartWarnings = useRAQIV2PredefinedWarnings(chartSpecs);

  const multiMetricSpec = useMemo(() => {
    const metricSpecs = chartSpecs.map((spec) => ({ metric: spec.metric, filter: spec.filter }));
    return {
      ...chartSpecs[0],
      metricSpec: metricSpecs,
    };
  }, [chartSpecs]);

  const effectiveComparison = useMemo(() => {
    const resolvedComparison = resolveComparisonConfig(predefinedComparison, comparison);
    return shouldShowComparison(effectiveSummarySpec)
      ? resolvedComparison
      : { ...resolvedComparison, chip: false };
  }, [comparison, effectiveSummarySpec, predefinedComparison]);

  const effectiveTitleKey = useMemo(() => {
    return titleKeyByGranularity?.[chartContext.granularity] ?? titleKey;
  }, [titleKeyByGranularity, chartContext.granularity, titleKey]);

  const effectiveDefinitionTooltipKey = useMemo(() => {
    return definitionTooltipKeyByGranularity?.[chartContext.granularity] ?? definitionTooltipKey;
  }, [definitionTooltipKeyByGranularity, chartContext.granularity, definitionTooltipKey]);

  const raqiV2ChartProps: RAQIV2GenericChartProps = useMemo(() => {
    const effectiveOverlays = chartProps.overlays ?? predefinedOverlays;
    const mergedDisplayOptions = {
      ...predefinedDisplayOptions,
      ...chartProps.displayOptions,
    };

    const commonProps = {
      chartKeyOrConfig,
      chartWarnings,
      summarySpec: effectiveSummarySpec,
      comparison: effectiveComparison,
      ...predefinedProps,
      ...chartProps,
      overlays: effectiveOverlays,
      displayOptions: mergedDisplayOptions,
      titleKey: effectiveTitleKey,
      definitionTooltipKey: effectiveDefinitionTooltipKey,
      quotaConfig: getQuotaConfigFromPredefinedChart(chartKeyOrConfig),
    };
    const chartType = getChartTypeFromPredefinedChart(chartKeyOrConfig, chartSpecs[0]);
    if (chartType === ChartType.MultipleMetricSpline) {
      return {
        ...commonProps,
        chartType: ChartType.MultipleMetricSpline,
        spec: multiMetricSpec,
      };
    }
    if (chartType === ChartType.Table) {
      throw new Error(
        'AnalyticsConfigChart cannot render ChartType.Table; use AnalyticsConfigTable instead.',
      );
    }
    return {
      ...commonProps,
      chartType,
      spec: chartSpecs[0],
    };
  }, [
    chartKeyOrConfig,
    chartWarnings,
    effectiveSummarySpec,
    effectiveComparison,
    predefinedOverlays,
    predefinedDisplayOptions,
    predefinedProps,
    chartProps,
    effectiveTitleKey,
    effectiveDefinitionTooltipKey,
    chartSpecs,
    multiMetricSpec,
  ]);

  const { updateTimeSeriesAnnotationsGivenChartContext } = useCurrentAnnotationsBundleProvider(
    chartContext.resource.type,
  );
  useEffect(() => {
    updateTimeSeriesAnnotationsGivenChartContext(chartContext);
  }, [chartContext, updateTimeSeriesAnnotationsGivenChartContext]);

  const chartContainerId = useMemo(
    () => getUniqueKeyForAnalyticsComponent(chartKeyOrConfig),
    [chartKeyOrConfig],
  );
  const dragDropContext = useAnalyticsChartContainerDragDropContext();

  if (!dragDropContext?.isEnabled) {
    return (
      <Grid item XSmall={12}>
        <RAQIV2GenericChart {...raqiV2ChartProps} />
      </Grid>
    );
  }

  return (
    <Grid item XSmall={12}>
      <SortableAnalyticsChartContainer
        itemId={chartContainerId}
        dropIndicator={dragDropContext.getDropIndicator(chartContainerId)}
        resizeOptions={dragDropContext.getResizeOptions?.(chartContainerId)}>
        <RAQIV2GenericChart {...raqiV2ChartProps} />
      </SortableAnalyticsChartContainer>
    </Grid>
  );
};

export default AnalyticsConfigChart;
