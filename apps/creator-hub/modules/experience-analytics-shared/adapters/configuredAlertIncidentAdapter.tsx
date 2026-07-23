import type { ReactNode } from 'react';
import type { TranslationKeyAndTagsToFormattedReactNode } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import {
  AlertAnnotationSeverity,
  toAnnotationId,
  type TAnnotationId,
  type TimeSeriesAnnotation,
} from '@modules/charts-generic/charts/types/Annotations';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import type { CustomAlertAnnotationItem } from '@modules/clients/analytics';
import { AnnotationType } from '@modules/clients/analytics';
import { AnalyticsAlertSeverity } from '@modules/clients/analytics/analyticsAlertControlPlane';
import { refineRawAlertConfigFields } from '@modules/experience-alerts/utils/analyticsAlertResponseValidation';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type ConfiguredAlertIncidentAnnotation = TimeSeriesAnnotation & {
  type: AnnotationType.ConfiguredAlertIncident;
};

/**
 * Map raw API alert severity (`"SEV_0"`/`"SEV_1"`/`"SEV_2"`) to the chart's
 * `AlertAnnotationSeverity` (Error / Warning / Minor).
 *
 * A `Record` lookup is used (rather than a `switch`) so the comparison stays a
 * pure key lookup — comparing a raw string to `AnalyticsAlertSeverity` enum
 * members directly trips `typescript-eslint/no-unsafe-enum-comparison`.
 */
const SEVERITY_TO_ANNOTATION_SEVERITY: Readonly<
  Record<AnalyticsAlertSeverity, AlertAnnotationSeverity>
> = {
  [AnalyticsAlertSeverity.SEV_0]: AlertAnnotationSeverity.Error,
  [AnalyticsAlertSeverity.SEV_1]: AlertAnnotationSeverity.Warning,
  [AnalyticsAlertSeverity.SEV_2]: AlertAnnotationSeverity.Minor,
};

const buildIncidentAnnotationId = (alertId: string, incidentId: string): TAnnotationId =>
  toAnnotationId(`${AnnotationType.ConfiguredAlertIncident}-${alertId}-${incidentId}`);

const buildTooltipRenderer =
  (alertName: string): ((translateHTML: TranslationKeyAndTagsToFormattedReactNode) => ReactNode) =>
  (translateHTML) => (
    <>
      {translateHTML(translationKey('Label.AlertFired', TranslationNamespace.Analytics))}{' '}
      {alertName}
    </>
  );

/**
 * Convert a list of `CustomAlertAnnotationItem` from the alert control plane
 * into chart-renderable `ConfiguredAlertIncident` range annotations.
 *
 * - `metric`, `severity`, `filter`, `breakdown`, and `description` are
 *   normalised via `refineRawAlertConfigFields` so chart-context filtering in
 *   `useChartTimeSeriesAnnotations` can compare against the same UI shapes
 *   the chart's own metric/filter/breakdown use. Refinement is wrapped in a
 *   try/catch and the incident is dropped on failure (logged once) — it
 *   couldn't have been matched to any chart anyway.
 * - `startUtc` is forwarded as-is (the response parser already aligned it to
 *   the alert's evaluation-window start so it snaps to the chart's buckets).
 * - `endUtc` falls back to `startUtc` when the incident is still firing
 *   (`item.endUtc == null`); the final range is clamped to the chart's
 *   time-axis end by `useTimeSeriesWebbloxAnnotations`, signalled by
 *   `isUnresolved: true`.
 */
export const adaptConfiguredAlertIncidentsToRangeAnnotations = (
  items: readonly CustomAlertAnnotationItem[],
): ConfiguredAlertIncidentAnnotation[] =>
  items.flatMap((item) => {
    let refined;
    try {
      refined = refineRawAlertConfigFields({
        metric: item.metric,
        severity: item.severity,
        description: item.description,
        interval: item.interval,
        filter: item.filter,
        breakdown: item.breakdown,
        condition: item.condition,
      });
    } catch (err) {
      logAnalyticsError(
        `Dropping configured alert incident ${item.incidentId}: refine failed (${String(err)})`,
      );
      return [];
    }

    const isUnresolved = item.endUtc == null;
    const endUtc = item.endUtc ?? item.startUtc;

    return [
      {
        id: buildIncidentAnnotationId(item.alertId, item.incidentId),
        type: AnnotationType.ConfiguredAlertIncident,
        startUtc: item.startUtc,
        endUtc,
        severity: SEVERITY_TO_ANNOTATION_SEVERITY[refined.severity],
        tooltipRenderer: buildTooltipRenderer(item.alertName),
        metric: refined.metric,
        alertId: item.alertId,
        alertName: item.alertName,
        isUnresolved,
        filter: refined.filter,
        breakdown: refined.breakdown,
      },
    ];
  });

export default adaptConfiguredAlertIncidentsToRangeAnnotations;
