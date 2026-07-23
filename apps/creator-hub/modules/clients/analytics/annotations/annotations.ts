import type { Annotation } from '@rbx/client-analytics-annotations-api/v1';
import { AnnotationType as SwaggerAnnotationType } from '@rbx/client-analytics-annotations-api/v1';
import type {
  AnalyticsAlertCondition,
  AnalyticsAlertInterval,
  AnalyticsAlertQueryBreakdown,
  AnalyticsAlertQueryFilter,
} from '../analyticsAlertControlPlane';
import type { ChartResource } from '../analyticsRAQIShared';

export enum AnnotationType {
  PlaceIcon = 'PlaceIcon',
  PlaceThumbnail = 'PlaceThumbnail',
  PlaceVideo = 'PlaceVideo',
  PlaceVersion = 'PlaceVersion',
  Benchmark = 'Benchmark',
  FunnelStepNameChange = 'FunnelStepNameChange',
  LiveEvent = 'LiveEvent',
  CustomMatchmaking = 'CustomMatchmaking',
  EngineRelease = 'EngineRelease',
  MemoryStoreMemoryUsageAlert = 'MemoryStoreMemoryUsageAlert',
  MemoryStoreRequestsAlert = 'MemoryStoreRequestsAlert',
  ClientCrashRateNotStableAlert = 'ClientCrashRateNotStableAlert',
  RetentionCorhortDisclaimer = 'RetentionCorhortDisclaimer',
  ConfigVersion = 'ConfigVersion',
  Announcement = 'Announcement',
  ExtendedServicesEnablement = 'ExtendedServicesEnablement',
  ConfiguredAlertIncident = 'ConfiguredAlertIncident',
  CreatorRegexChange = 'CreatorRegexChange',
}

export type AnnotationAlertType =
  | AnnotationType.MemoryStoreMemoryUsageAlert
  | AnnotationType.MemoryStoreRequestsAlert
  | AnnotationType.ClientCrashRateNotStableAlert;

export const isAnnotationAlertType = (
  annotationType: AnnotationType,
): annotationType is AnnotationAlertType => {
  return (
    annotationType === AnnotationType.MemoryStoreMemoryUsageAlert ||
    annotationType === AnnotationType.MemoryStoreRequestsAlert ||
    annotationType === AnnotationType.ClientCrashRateNotStableAlert
  );
};

export type TGenericAnnotationType = Exclude<
  AnnotationType,
  | AnnotationAlertType
  | AnnotationType.RetentionCorhortDisclaimer
  | AnnotationType.Announcement
  | AnnotationType.ConfiguredAlertIncident
>;

// NOTE(@bxu - 10/3/2023): Define a mirror of AnnotationType because the gRPC transcoded Swagger document returns
// numbers instead.
export const UIAnnotationTypeToApiAnnotation: Record<
  TGenericAnnotationType,
  SwaggerAnnotationType
> = {
  [AnnotationType.PlaceIcon]: SwaggerAnnotationType.NUMBER_1,
  [AnnotationType.PlaceThumbnail]: SwaggerAnnotationType.NUMBER_4,
  [AnnotationType.PlaceVersion]: SwaggerAnnotationType.NUMBER_5,
  [AnnotationType.Benchmark]: SwaggerAnnotationType.NUMBER_6,
  [AnnotationType.FunnelStepNameChange]: SwaggerAnnotationType.NUMBER_7,
  [AnnotationType.LiveEvent]: SwaggerAnnotationType.NUMBER_8,
  [AnnotationType.CustomMatchmaking]: SwaggerAnnotationType.NUMBER_9,
  [AnnotationType.EngineRelease]: SwaggerAnnotationType.NUMBER_10,
  [AnnotationType.PlaceVideo]: SwaggerAnnotationType.NUMBER_11,
  [AnnotationType.ConfigVersion]: SwaggerAnnotationType.NUMBER_12,
  [AnnotationType.ExtendedServicesEnablement]: SwaggerAnnotationType.NUMBER_15,
  [AnnotationType.CreatorRegexChange]: SwaggerAnnotationType.NUMBER_16,
};

export enum AnnotationBenchmarkType {
  Similarity = 'SIMILARITY',
  Genre = 'GENRE',
}

export enum AnnotationCustomMatchmakingChangeType {
  Enrollment = 'Enrollment',
  Unenrollment = 'Unenrollment',
  WeightsUpdate = 'WeightsUpdate',
}

export enum AnnotationEngineReleasePlatform {
  Rcc = 'RCC',
  WindowsPlayer = 'WindowsPlayer',
  MacPlayer = 'MacPlayer',
}

export enum AnnotationCreatorRegexOperation {
  IgnoreAdd = 'REGEX_OPERATION_IGNORE_ADD',
  IgnoreRemove = 'REGEX_OPERATION_IGNORE_REMOVE',
}

// Enablement tier carried by `ExtendedServicesEnablement` annotations. Values
// mirror the wire strings emitted by the analytics-annotations API's
// `EnablementType` proto enum (`ENABLEMENT_TYPE_STANDARD` = free tier,
// `ENABLEMENT_TYPE_EXTENDED` = paid tier), so the standard/extended quota
// start/end transitions can be distinguished on the chart.
export enum AnnotationEnablementType {
  Standard = 'ENABLEMENT_TYPE_STANDARD',
  Extended = 'ENABLEMENT_TYPE_EXTENDED',
}

export type getAnnotationsRequest = {
  annotationType: keyof typeof UIAnnotationTypeToApiAnnotation;
  resource: ChartResource;
  placeId?: number;
  rootPlaceId?: number;
  funnelName?: string;
  startUtc: Date;
  endUtc: Date;
};

/** Request shape for {@link AnnotationsClient.getCustomAlertAnnotation}. */
export type GetCustomAlertAnnotationRequest = {
  resource: ChartResource;
  startUtc: Date;
  endUtc: Date;
};

/**
 * Lightweight projection of a fired-alert incident used to build a
 * {@link AnnotationType.ConfiguredAlertIncident} range annotation. The shape
 * is decoupled from the full alert-incident detail (no firing metadata) so
 * the `AnnotationsClient` does not pull in `experience-alerts` types.
 *
 * `startUtc` / `endUtc` are mapped from the SDK's `openedWindowStartAt` /
 * `resolvedWindowStartAt` (the window-aligned bounds, which snap to the same
 * time bucket the chart's data points use) by the response parser. The full
 * incident-detail response still exposes `openedAt` / `resolvedAt` for the
 * alert history table.
 */
export type CustomAlertAnnotationItem = {
  incidentId: string;
  alertId: string;
  alertName: string;
  /** Raw API metric string; refined to a `TRAQIV2NumericUIMetric` downstream. */
  metric: string;
  /** Raw API severity (wire string `"SEV_0"` / `"SEV_1"` / `"SEV_2"`); adapter maps to display severity. */
  severity: string;
  description?: string | null;
  /** Alert-config evaluation interval; required to refine `metric` to a UI metric. */
  interval: AnalyticsAlertInterval;
  startUtc: Date;
  /** Undefined or null means the incident is still firing; the renderer falls back to the chart end date. */
  endUtc?: Date | null;
  /**
   * Raw alert-config filter rows (already RAQIV2Dimension-validated by the
   * incident-detail parser). Refined downstream into `RAQIV2QueryFilter[]`,
   * including any reconstructed pseudo filter (`PercentileType` /
   * `AggregationType`).
   */
  filter?: ReadonlyArray<AnalyticsAlertQueryFilter> | null;
  /**
   * Raw alert-config breakdown rows. Refined downstream into a flat list of
   * `TRAQIV2Dimension`s restricted to dimensions allowed for the metric.
   */
  breakdown?: ReadonlyArray<AnalyticsAlertQueryBreakdown> | null;
  /** Alert-config condition; required by `refineRawAlertConfigFields`. */
  condition: AnalyticsAlertCondition;
};

export type AnnotationsClient = {
  /**
   * Returns annotations for a specific type. We iterate through all pFages within the client method, and returns as
   * a single list.
   */
  getAnnotations(request: getAnnotationsRequest): Promise<Annotation[]>;

  /**
   * Returns user-configured alert incidents that overlap with the requested time range,
   * to be rendered as range annotations (see `AnnotationType.ConfiguredAlertIncident`).
   * Implementations call the alert control plane's `listAlertIncidents` and project each
   * incident down to {@link CustomAlertAnnotationItem}. Resource types that do not
   * support configured alerts (e.g. Group/User) should return `[]`.
   */
  getCustomAlertAnnotation(
    request: GetCustomAlertAnnotationRequest,
  ): Promise<CustomAlertAnnotationItem[]>;
};

export type { Annotation };
