import { FC, useMemo, useEffect } from 'react';
import { ChartType } from '@modules/charts-generic';
import { Grid } from '@rbx/ui';
import RAQIV2PredefinedChartKey from '../../constants/RAQIV2PredefinedChartKey';
import RAQIV2ChartContext from '../../types/RAQIV2ChartContext';
import computeRAQIV2SpecOverride from '../../utils/computeRAQIV2SpecOverride';
import useRAQIV2PredefinedWarnings from '../../hooks/useRAQIV2PredefinedWarnings';
import GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import {
  getChartTypeFromPredefinedChart,
  getMetricRelatedConfigFromPredefinedChart,
  getNonMetricRelatedConfigFromPredefinedChart,
  getHideComparisonChipFromPredefinedChart,
  getQuotaMetricFromPredefinedChart,
  getOverlays,
  getDisplayOptions,
  ChartConfigOrPredefinedKey,
} from '../../constants/RAQIV2PredefinedChartConfig';
import RAQIV2GenericChart, { RAQIV2GenericChartProps } from './RAQIV2GenericChart';
import { shouldShowComparison } from '../../adapters/genericRAQIV2ChartSummaryAdapter';
import useCurrentAnnotationsBundleProvider from '../../hooks/useCurrentAnnotationsBundleProvider';
import getUniqueKeyForAnalyticsComponent from '../../utils/getUniqueKeyForAnalyticsComponent';
import { useAnalyticsChartContainerDragDropContext } from './layout/AnalyticsChartContainerDragDropContext';
import SortableAnalyticsChartContainer from './layout/SortableAnalyticsChartContainer';

export type AnalyticsConfigChartProps = {
  chartKeyOrConfig: ChartConfigOrPredefinedKey;
  predefinedChartKeyForAssistant?: RAQIV2PredefinedChartKey;
  chartContext: RAQIV2ChartContext;
} & Omit<GenericRAQIV2ChartProps, 'spec' | 'footerProps' | 'chartWarnings'>;

// Single chart component for predefined RAQI V2 charts
const AnalyticsConfigChart: FC<AnalyticsConfigChartProps> = ({
  chartKeyOrConfig,
  chartContext,
  hideComparisonChip,
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
    ...predefinedProps
  } = partialPredefinedChartConfig;
  const predefinedOverlays = getOverlays(partialPredefinedChartConfig);
  const predefinedDisplayOptions = getDisplayOptions(partialPredefinedChartConfig);
  const metricConfigs = useMemo(
    () => getMetricRelatedConfigFromPredefinedChart(chartKeyOrConfig),
    [chartKeyOrConfig],
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

  const hideComparisonChipOverride = useMemo(() => {
    return (
      !shouldShowComparison(summarySpec) ||
      hideComparisonChip ||
      getHideComparisonChipFromPredefinedChart(chartKeyOrConfig)
    );
  }, [summarySpec, hideComparisonChip, chartKeyOrConfig]);

  const effectiveTitleKey = useMemo(() => {
    return titleKeyByGranularity?.[chartContext.granularity] ?? titleKey;
  }, [titleKeyByGranularity, chartContext.granularity, titleKey]);

  const effectiveDefinitionTooltipKey = useMemo(() => {
    return definitionTooltipKeyByGranularity?.[chartContext.granularity] ?? definitionTooltipKey;
  }, [definitionTooltipKeyByGranularity, chartContext.granularity, definitionTooltipKey]);

  const raqiV2ChartProps: RAQIV2GenericChartProps = useMemo(() => {
    const effectiveOverlays = chartProps.overlays ?? predefinedOverlays;
    const mergedDisplayOptions = {
      ...(predefinedDisplayOptions ?? {}),
      ...chartProps.displayOptions,
    };

    const commonProps = {
      chartKeyOrConfig,
      chartWarnings,
      summarySpec,
      hideComparisonChip: hideComparisonChipOverride,
      ...predefinedProps,
      ...chartProps,
      overlays: effectiveOverlays,
      displayOptions: mergedDisplayOptions,
      titleKey: effectiveTitleKey,
      definitionTooltipKey: effectiveDefinitionTooltipKey,
      quotaMetric: getQuotaMetricFromPredefinedChart(chartKeyOrConfig),
    };
    const chartType = getChartTypeFromPredefinedChart(chartKeyOrConfig, chartSpecs[0]);
    if (chartType === ChartType.MultipleMetricSpline) {
      return {
        ...commonProps,
        chartType: ChartType.MultipleMetricSpline,
        spec: multiMetricSpec,
      };
    }
    return {
      ...commonProps,
      chartType,
      spec: chartSpecs[0],
    };
  }, [
    chartKeyOrConfig,
    chartWarnings,
    summarySpec,
    hideComparisonChipOverride,
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
