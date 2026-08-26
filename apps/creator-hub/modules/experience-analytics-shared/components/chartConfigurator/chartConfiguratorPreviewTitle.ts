import formatEnglishWithArgs from '@modules/analytics-translations/formatEnglishWithArgs';
import type { TPendingTranslationFunction } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ComputedMetric } from '../../types/ComputedMetric';
import { collapseComputedMetricToSimple } from './computedMetricUrlOwnership';

export const SMOOTHING_CHART_TITLE_ENGLISH = '{metricName} (7 day moving average)';

export const smoothingChartTitleTranslationKey = translationKey(
  'Label.ExploreMode.Smoothing.ChartTitleFormat',
  TranslationNamespace.Analytics,
);

export function formatSmoothingChartTitleLabel(
  tPendingTranslation: TPendingTranslationFunction,
  metricName: string,
): string {
  return String(
    tPendingTranslation(
      '{metricName} (7 day moving average)',
      'Chart title when L7 smoothing is enabled. {metricName} is replaced with the metric display name.',
      translationKey(
        'Label.ExploreMode.Smoothing.ChartTitleFormat',
        TranslationNamespace.Analytics,
      ),
      { metricName },
    ),
  );
}

export function formatEnglishSmoothingChartTitleLabel(metricName: string): string {
  return String(formatEnglishWithArgs(SMOOTHING_CHART_TITLE_ENGLISH, { metricName }));
}

type ResolveChartConfiguratorPreviewTitleLabelArgs = {
  readonly authoredChartTitleLabel?: string;
  readonly computedMetricChart: ComputedMetric | null;
  readonly computedMetricChartTitleLabel?: string;
  readonly defaultMetricTitleLabel?: string;
  readonly fallbackChartTitleLabel?: string;
  readonly formatSmoothingTitleLabel: (metricName: string) => string;
  readonly isPrecomputedL7MetricChart?: boolean;
  readonly untitledFormulaLabel?: string;
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
    (computedMetricChart?.l7Smoothing === true && Boolean(simpleMetricCollapse));
  const metricNameForSmoothing = simpleMetricTitleLabel ?? defaultMetricTitleLabel;
  const smoothingTitleLabel =
    shouldShowSmoothingTitle && metricNameForSmoothing !== undefined
      ? formatSmoothingTitleLabel(metricNameForSmoothing)
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
