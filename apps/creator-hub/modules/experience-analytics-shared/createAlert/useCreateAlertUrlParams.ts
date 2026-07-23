import { useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import { isExperienceAlertsEnabled } from '@generated/flags/creatorAnalytics';
import type { AnalyticsSearchParams } from '@modules/charts-generic/utils/analyticsUrlBuilder';
import {
  getAlertEligibleMetrics,
  resolveCanonicalAlertMetric,
} from '@modules/experience-alerts/utils/analyticsAlertFormUtils';
import { getChartConfiguratorDimensions } from '../chartConfigurator/ChartConfiguratorDimensions';
import type { TChartConfiguratorMetrics } from '../chartConfigurator/chartConfiguratorMetricsConfig';
import { getSharedChartContextQueryParams } from '../exploreMode/getExploreModeUrlParams';
import useCurrentChartContext from '../exploreMode/useCurrentChartContext';
import { useAnalyticsExperiencePermissions } from '../hooks/useAnalyticsPermissions';
import { useUniverseResource } from '../hooks/useChartResourceProvider';
import { isComputedMetric, isCustomEventsAtomicMetricLike } from '../types/ComputedMetric';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';

/**
 * Builds the query params for a "Create alert" deep link from a chart's spec
 * (metric + current context), or returns `null` when the user/universe/metric
 * are not eligible to create an alert — letting the caller hide the button
 * entirely.
 *
 * Eligibility (all required):
 *  - `userCanManageAnalyticsAlertForUniverse` permission for this universe.
 *  - `isExperienceAlertsEnabled` feature flag for this universe.
 *  - The spec's metric (resolved to its canonical alert metric) is in
 *    `getAlertEligibleMetrics()`. Computed (formula) metrics and the
 *    CustomEventsV2 wrapper are never alert-eligible and collapse to `null`.
 *
 * The `MAX_ALERTS_PER_RESOURCE` cap is intentionally not checked here: counting
 * a universe's alerts would require a per-chart list query, and the create page
 * and control plane already enforce the cap on submit.
 *
 * The metric is read straight off `spec.metric`, so any surface that already
 * has a chart spec (chart cards, Explore Mode) gets a correctly pre-filled
 * link without threading a separate predefined-chart key.
 */
const useCreateAlertUrlParams = (spec: RAQIV2ChartSpec | null): AnalyticsSearchParams | null => {
  const resource = useUniverseResource();

  const { userCanManageAnalyticsAlertForUniverse } = useAnalyticsExperiencePermissions(resource.id);
  const { ready: isExperienceAlertsReady, value: isExperienceAlertsEnabledValue } = useFlag(
    isExperienceAlertsEnabled,
    {
      universeId: resource.id,
    },
  );

  // The chart's own metric drives granularity/dimension resolution and the
  // canonical alert metric we gate eligibility on. Only a bare atomic UI metric
  // is alertable: computed formulas have no single target, and the CustomEventsV2
  // wrapper carries an event-name identity an alert can't express — both reduce
  // to null so the action is hidden.
  const uiMetric = useMemo<TChartConfiguratorMetrics | null>(() => {
    const metric = spec?.metric;
    if (!metric || isComputedMetric(metric) || isCustomEventsAtomicMetricLike(metric)) {
      return null;
    }
    return metric;
  }, [spec]);
  const canonicalAlertMetric = uiMetric ? resolveCanonicalAlertMetric(uiMetric) : null;
  const isMetricEligible = useMemo(() => {
    if (!canonicalAlertMetric) {
      return false;
    }
    return getAlertEligibleMetrics().includes(canonicalAlertMetric);
  }, [canonicalAlertMetric]);

  const isEligible =
    userCanManageAnalyticsAlertForUniverse &&
    isExperienceAlertsReady &&
    isExperienceAlertsEnabledValue &&
    isMetricEligible;

  const dimensions = useMemo(() => {
    if (!uiMetric) {
      return [];
    }
    const chartConfiguratorDimensions = getChartConfiguratorDimensions();
    return chartConfiguratorDimensions?.[uiMetric] || [];
  }, [uiMetric]);

  // `useCurrentChartContext` is a hook and must run unconditionally; passing a
  // null metric short-circuits it to a sensible default context. The spec is
  // assignable to `RAQIV2ChartContext` (a metric-less superset), so its
  // granularity/filter/breakdown override the provider-derived defaults.
  const chartContext = useCurrentChartContext({
    resource,
    dimensions,
    metric: isEligible ? uiMetric : null,
    chartContextOverride: spec ?? undefined,
  });

  return useMemo(() => {
    if (!isEligible || !canonicalAlertMetric) {
      return null;
    }
    // Reuses Explore Mode's shared serializer so the alert deep link always
    // agrees on the metric/granularity/breakdown/filter param names. Alerts
    // intentionally consume only these four fields and resolve everything else
    // (preset, overlays, time range, ...) from form defaults.
    return getSharedChartContextQueryParams({
      metric: canonicalAlertMetric,
      granularity: chartContext.granularity,
      filter: chartContext.filter,
      breakdown: chartContext.breakdown,
    });
  }, [canonicalAlertMetric, chartContext, isEligible]);
};

export default useCreateAlertUrlParams;
