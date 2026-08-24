import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Grid } from '@rbx/ui';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { shouldShowComparison } from '../../adapters/genericRAQIV2ChartSummaryAdapter';
import type { RAQIV2SummarySpec } from '../../adapters/genericRAQIV2ChartSummaryAdapter';
import type { ChartConfigOrPredefinedKey } from '../../constants/RAQIV2PredefinedChartConfig';
import {
  getChartConfigExecutionMetric,
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
import { isComputedMetric, type MetricLike } from '../../types/ComputedMetric';
import type GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import type RAQIV2ChartContext from '../../types/RAQIV2ChartContext';
import type RAQIV2ChartSpec from '../../types/RAQIV2ChartSpec';
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

const getExecutionMetricIdentityKey = (executionMetric: MetricLike) => {
  if (!isComputedMetric(executionMetric)) {
    return executionMetric;
  }
  const { sources, formula, l7Smoothing } = executionMetric;
  return l7Smoothing !== undefined ? { sources, formula, l7Smoothing } : { sources, formula };
};

const getChartSpecsIdentityKey = (specs: readonly RAQIV2ChartSpec[]) =>
  JSON.stringify(
    specs.map((spec) => ({
      metric: getExecutionMetricIdentityKey(spec.metric),
      filter: spec.filter,
      breakdown: spec.breakdown,
      granularity: spec.granularity,
      timeSpec: spec.timeSpec,
      limit: spec.limit,
      resource: spec.resource,
      timeAxisBounds: spec.timeAxisBounds,
      benchmarkPercentiles: spec.benchmarkPercentiles,
    })),
  );

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

  // Stringify is the identity cache key only. Keep the typed spec (and its
  // MetricLike) from getChartConfigExecutionMetric so a rename does not rebuild
  // queryRequest. Adjusting state during render is required: useMemo keyed only
  // on the signature would omit producing inputs from its deps, and React
  // Compiler would add them back and bust identity on a new chartKeyOrConfig.
  const nextChartSpecs = metricConfigs.map(({ metric, overrides }) =>
    computeRAQIV2SpecOverride(
      {
        ...chartContext,
        metric: getChartConfigExecutionMetric(chartKeyOrConfig, metric),
      },
      overrides,
    ),
  );
  const chartSpecsSignature = getChartSpecsIdentityKey(nextChartSpecs);
  const [cachedChartSpecs, setCachedChartSpecs] = useState<{
    signature: string;
    specs: RAQIV2ChartSpec[];
  }>(() => ({
    signature: chartSpecsSignature,
    specs: nextChartSpecs,
  }));
  const chartSpecs =
    cachedChartSpecs.signature === chartSpecsSignature ? cachedChartSpecs.specs : nextChartSpecs;
  if (cachedChartSpecs.signature !== chartSpecsSignature) {
    setCachedChartSpecs({
      signature: chartSpecsSignature,
      specs: nextChartSpecs,
    });
  }

  const chartWarnings = useRAQIV2PredefinedWarnings(chartSpecs);

  const multiMetricSpec = useMemo(() => {
    const metricSpecs = metricConfigs.map(({ metric }, index) => ({
      metric,
      filter: chartSpecs[index]?.filter,
    }));
    return {
      ...chartSpecs[0],
      metricSpec: metricSpecs,
    };
  }, [chartSpecs, metricConfigs]);

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
