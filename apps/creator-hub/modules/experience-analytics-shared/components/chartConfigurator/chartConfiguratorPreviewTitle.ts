import type { ComputedMetric } from '../../types/ComputedMetric';
import { collapseComputedMetricToSimple } from './computedMetricUrlOwnership';

type ResolveChartConfiguratorPreviewTitleLabelArgs = {
  readonly authoredChartTitleLabel?: string;
  readonly computedMetricChart: ComputedMetric | null;
  readonly computedMetricChartTitleLabel?: string;
  readonly defaultMetricTitleLabel: string;
  readonly fallbackChartTitleLabel?: string;
  readonly formatSmoothingTitleLabel: (metricName: string) => string;
  readonly isPrecomputedL7MetricChart?: boolean;
  readonly untitledFormulaLabel: string;
};

export function resolveChartConfiguratorPreviewTitleLabel({
  authoredChartTitleLabel,
  computedMetricChart,
  computedMetricChartTitleLabel,
  defaultMetricTitleLabel,
  fallbackChartTitleLabel,
  formatSmoothingTitleLabel,
  isPrecomputedL7MetricChart = false,
  untitledFormulaLabel,
}: ResolveChartConfiguratorPreviewTitleLabelArgs): string | undefined {
  const trimmedAuthoredTitle = authoredChartTitleLabel?.trim();
  const authoredTitleLabel = trimmedAuthoredTitle === '' ? undefined : trimmedAuthoredTitle;

  const simpleMetricCollapse = computedMetricChart
    ? collapseComputedMetricToSimple(computedMetricChart)
    : null;
  const simpleMetricTitleLabel = fallbackChartTitleLabel ?? simpleMetricCollapse?.customEventName;
  const shouldShowSmoothingTitle =
    isPrecomputedL7MetricChart ||
    (computedMetricChart?.l7Smoothing === true && simpleMetricCollapse);
  const smoothingTitleLabel = shouldShowSmoothingTitle
    ? formatSmoothingTitleLabel(simpleMetricTitleLabel ?? defaultMetricTitleLabel)
    : undefined;
  const fallbackComputedMetricTitleLabel = simpleMetricCollapse
    ? simpleMetricTitleLabel
    : untitledFormulaLabel;
  const computedMetricTitleLabel = computedMetricChart
    ? (computedMetricChartTitleLabel ?? smoothingTitleLabel ?? fallbackComputedMetricTitleLabel)
    : undefined;

  return (
    authoredTitleLabel ?? computedMetricTitleLabel ?? smoothingTitleLabel ?? fallbackChartTitleLabel
  );
}
