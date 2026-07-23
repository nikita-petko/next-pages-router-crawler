import {
  RAQIV2Dimension,
  RAQIV2MetricToSupportedDimensions,
} from '@rbx/creator-hub-analytics-config';
import { RecommendedEventType } from '@modules/clients/analytics';
import type { TChartConfiguratorMetrics } from '@modules/experience-analytics-shared/chartConfigurator/chartConfiguratorMetricsConfig';
import { codegenChartConfiguratorMetricToGroup } from '@modules/experience-analytics-shared/chartConfigurator/codegenChartConfiguratorMetricGrouping';
import {
  customEventsMetric,
  isEconomySource,
} from '@modules/experience-analytics-shared/components/chartConfigurator/useChartConfiguratorSourceSelection';

// A metric is "funnel-related" if its codegen-supported dimensions include
// FunnelName — only the funnel metrics (FunnelUserTotalCount,
// FunnelStepCompletionRate, conversion/churn variants, etc.)
// declare that dimension today, and any new funnel metric will inherit
// the same supported-dimensions shape from the codegen pipeline. None of
// those metrics are exposed to explore mode yet, but checking the codegen
// signal directly future-proofs this CTA so it lights up automatically
// when they do appear.
function isFunnelMetric(metric: TChartConfiguratorMetrics): boolean {
  const supportedDimensions: readonly string[] = RAQIV2MetricToSupportedDimensions[metric] ?? [];
  return supportedDimensions.includes(RAQIV2Dimension.FunnelName);
}

// Picks the live-events stream the dialog should default to based on the
// active explore-mode metric. Returns null for metrics that don't have an
// obvious live-events counterpart — callers should treat null as "this
// metric isn't relevant to live events, hide the CTA". The dialog's own
// filter still lets the user switch streams once it's open.
//
// Used by the explore-mode header to decide whether the View Events CTA
// renders and whether Share collapses into the overflow menu alongside
// Download CSV when View Events is present.
export function getDefaultEventTypeForMetric(
  metric: TChartConfiguratorMetrics | null,
): RecommendedEventType | null {
  if (metric === null) {
    return null;
  }
  if (metric === customEventsMetric) {
    return RecommendedEventType.CustomEvents;
  }
  // Reuse the codegen grouping that powers the source selector so we don't
  // have to maintain a parallel "is this an economy metric?" allowlist here.
  if (isEconomySource(codegenChartConfiguratorMetricToGroup(metric))) {
    return RecommendedEventType.EconomyEvents;
  }
  if (isFunnelMetric(metric)) {
    return RecommendedEventType.ProgressionEvents;
  }
  return null;
}
