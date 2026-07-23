import type {
  AlertsGetAlertDetailsRequest as ListAnalyticsAlertsRequest,
  AlertsCreateAlertConfigOperationRequest as CreateAnalyticsAlertRequest,
  AlertsUpdateAlertConfigOperationRequest as UpdateAnalyticsAlertRequest,
  AlertsGetAlertIncidentsRequest as ListAnalyticsAlertIncidentsRequest,
  AlertsDeleteAlertConfigRequest as DeleteAnalyticsAlertRequest,
  AnalyticsAlertControlPlaneModelsAlertDetailResponse as RawAnalyticsAlertDetail,
  AnalyticsAlertControlPlaneModelsErrorResponse as RawAnalyticsAlertErrorResponse,
  AnalyticsAlertControlPlaneModelsFiringMetadataResponse as RawAnalyticsAlertFiringMetadata,
  AnalyticsAlertControlPlaneModelsFiringConditionResponse as RawAnalyticsAlertFiringCondition,
  AnalyticsAlertControlPlaneModelsIncidentDetailResponse as SdkAnalyticsAlertIncidentDetail,
  AnalyticsAlertControlPlaneModelsIncidentDetailResponseAlertConfig as SdkAnalyticsAlertIncidentDetailAlertConfig,
} from '@rbx/client-analytics-alert-control-plane/v1';
import {
  AlertsApi,
  AlertStorageAlertConfigState as AnalyticsAlertConfigState,
  AlertStorageFiringStatus as AnalyticsAlertFiringStatus,
  AlertStorageAlertInterval as AnalyticsAlertInterval,
  AlertStorageConditionOperator as AnalyticsAlertConditionOperator,
  AlertStorageResourceType as AnalyticsAlertResourceType,
  AlertStorageEvaluationMode as AnalyticsAlertEvaluationMode,
} from '@rbx/client-analytics-alert-control-plane/v1';
import { ResponseError } from '@rbx/clients-core';
import { RAQIV2Dimension, type TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { createClientConfiguration } from '../utils/createClientConfiguration';

/**
 * Wire-format severity for the analytics-alert-control-plane API. Member names
 * mirror the BE `AlertStorage.Severity` enum's string serialization
 * (`"SEV_0"` / `"SEV_1"` / `"SEV_2"`), matching the RAQI Severity dimension
 * values. The numeric suffix preserves criticality ordering on lexicographic
 * sort, where lower is more severe: SEV_0 (most severe) < SEV_1 < SEV_2.
 */
export enum AnalyticsAlertSeverity {
  SEV_0 = 'SEV_0',
  SEV_1 = 'SEV_1',
  SEV_2 = 'SEV_2',
}

export type AnalyticsAlertCondition = {
  operator: AnalyticsAlertConditionOperator;
  threshold: number;
  evaluationMode: AnalyticsAlertEvaluationMode;
  /**
   * Multiplier applied to the alert interval to set how far back the
   * period-over-period comparison datapoint is taken from (e.g. multiplier
   * `2` at a 30m interval compares against the datapoint 60m ago). Only
   * meaningful when `evaluationMode` is `PeriodOverPeriod`; `null`/omitted for
   * `Absolute` alerts and on legacy records persisted before the field
   * existed, where the backend treats a missing/sub-1 value as `1`.
   */
  periodOffsetMultiplier?: number | null;
};

/**
 * "Refined" firing-metadata types: every dimension on `filter`, `breakdown`, and
 * `firingCondition[].firingDimension` has been validated against {@link RAQIV2Dimension}
 * and narrowed to {@link TRAQIV2Dimension}. The API client (see {@link listAlertIncidents})
 * runs {@link parseAnalyticsAlertFiringMetadata} on each incident's first/latest firing
 * metadata before returning it, so downstream consumers can index dimensions into the
 * analytics dimension renderers/configs without further type guards or casts.
 */
export type AnalyticsAlertQueryFilter = {
  dimension: TRAQIV2Dimension;
  values: string[];
};
export type AnalyticsAlertQueryBreakdown = {
  dimensions: TRAQIV2Dimension[];
};
export type AnalyticsAlertFiringDimension = {
  dimension: TRAQIV2Dimension;
  value: string;
};
export type AnalyticsAlertFiringCondition = {
  firingValue: number;
  firingDimension?: AnalyticsAlertFiringDimension;
};
export type AnalyticsAlertFiringMetadata = {
  filter?: AnalyticsAlertQueryFilter[];
  breakdown?: AnalyticsAlertQueryBreakdown[];
  condition: AnalyticsAlertCondition;
  firingCondition: AnalyticsAlertFiringCondition[];
};

/**
 * Incident detail with two layers of refinement vs. the raw SDK shape:
 *
 * 1. Firing-metadata dimensions are validated against {@link TRAQIV2Dimension}.
 *    Unknown dimensions are dropped (filter / breakdown rows) or cleared
 *    (`firingCondition[].firingDimension`) at the boundary.
 *
 * 2. The SDK's nested `alertConfig` block is flattened into top-level fields
 *    here (no nested `alertConfig` on the FE):
 *    - `alertId` / `alertName` come from `alertConfig.id` / `alertConfig.name`.
 *    - `metric` / `severity` / `description` / `interval` / `filter` /
 *      `breakdown` / `condition` are lifted from `alertConfig.*`; `filter` /
 *      `breakdown` go through the same RAQIV2Dimension validation as
 *      firing-metadata via {@link parseRawFilters} and
 *      {@link parseRawBreakdowns}.
 *
 * Use `id` (a string-encoded int64) for the incident itself and `alertId`
 * for grouping incidents under their alert config.
 */
export type RawAnalyticsAlertIncidentDetail = Pick<
  SdkAnalyticsAlertIncidentDetail,
  | 'id'
  | 'resourceType'
  | 'resourceId'
  | 'status'
  | 'openedAt'
  | 'openedWindowStartAt'
  | 'resolvedAt'
  | 'resolvedWindowStartAt'
> &
  Omit<
    SdkAnalyticsAlertIncidentDetailAlertConfig,
    'id' | 'name' | 'filter' | 'breakdown' | 'condition'
  > & {
    /** Alert-config id (= the SDK incident's `alertConfig.id`). */
    alertId: string;
    /** Alert-config name (= the SDK incident's `alertConfig.name`). */
    alertName: string;
    firstFiringMetadata: AnalyticsAlertFiringMetadata;
    latestFiringMetadata: AnalyticsAlertFiringMetadata;
    interval: AnalyticsAlertInterval;
    filter?: AnalyticsAlertQueryFilter[];
    breakdown?: AnalyticsAlertQueryBreakdown[];
    condition: AnalyticsAlertCondition;
  };

export {
  AnalyticsAlertFiringStatus,
  AnalyticsAlertConfigState,
  AnalyticsAlertInterval,
  AnalyticsAlertConditionOperator,
  AnalyticsAlertResourceType,
  AnalyticsAlertEvaluationMode,
};
export type {
  ListAnalyticsAlertsRequest,
  CreateAnalyticsAlertRequest,
  UpdateAnalyticsAlertRequest,
  DeleteAnalyticsAlertRequest,
  ListAnalyticsAlertIncidentsRequest,
  RawAnalyticsAlertDetail,
  RawAnalyticsAlertErrorResponse,
  RawAnalyticsAlertFiringMetadata,
  RawAnalyticsAlertFiringCondition,
};

/**
 * Canonical machine-readable `errorCode` values returned in the JSON body of
 * 4xx / 5xx responses from the analytics-alert-control-plane API. Clients should key off the
 * code (and not the human-readable `message`) when branching on errors. Use
 * {@link readAnalyticsAlertErrorCode} to extract the code from a thrown SDK
 * error and {@link isAnalyticsAlertErrorCode} to narrow it.
 */
export const AnalyticsAlertErrorCode = {
  /** 400 — a required field is absent (route param, query param, body field). */
  RequiredFieldMissing: 'REQUIRED_FIELD_MISSING',
  /**
   * 400 — a field is present but malformed, out of range, not in the allowed
   * set, or otherwise invalid. Covers unknown metric / dimension /
   * granularity / operator / etc.
   */
  InvalidFieldValue: 'INVALID_FIELD_VALUE',
  /** 400 — alert name text is blocked by backend text moderation. */
  TextFilterBlockedName: 'TEXT_FILTER_BLOCKED_NAME',
  /** 400 — alert description text is blocked by backend text moderation. */
  TextFilterBlockedDescription: 'TEXT_FILTER_BLOCKED_DESCRIPTION',
  /** 401 — no authenticated user is associated with the request. */
  Unauthenticated: 'UNAUTHENTICATED',
  /**
   * 403 — caller lacks the required permission. Also covers (a) universe not
   * enrolled in PerformanceMonitoringV2 and (b) launch-gate feature flag off
   * for this caller.
   */
  PermissionDenied: 'PERMISSION_DENIED',
  /** 404 — alert config not found for the given `(resource, alertId)`. */
  AlertNotFound: 'ALERT_NOT_FOUND',
  /** 409 — per-resource alert cap (`MaxAlertsPerResource`) reached. */
  MaxAlertReached: 'MAX_ALERT_REACHED',
  /**
   * 409 — an alert with the requested name already exists for this resource.
   * Alert names must be unique within a `(resourceType, resourceId)`.
   */
  AlertNameExisted: 'ALERT_NAME_EXISTED',
  /**
   * 503 — a transient downstream-dependency failure (gRPC, storage,
   * feature-flag backend, etc.). Single bucket; detail in `message`. The FE
   * should render retry UX for this code.
   */
  ServiceUnavailable: 'SERVICE_UNAVAILABLE',
} as const;
export type AnalyticsAlertErrorCode =
  (typeof AnalyticsAlertErrorCode)[keyof typeof AnalyticsAlertErrorCode];

const ANALYTICS_ALERT_ERROR_CODE_VALUES: ReadonlySet<string> = new Set(
  Object.values(AnalyticsAlertErrorCode),
);

/**
 * Type guard for {@link AnalyticsAlertErrorCode}. Returns `true` only for the
 * canonical codes defined above; any unrecognized string (including codes the
 * BE has since retired or new codes the FE has not yet adopted) falls
 * through. Combine with {@link readAnalyticsAlertErrorCode} to dispatch on a
 * known code without coupling the caller to the raw SDK runtime.
 */
export const isAnalyticsAlertErrorCode = (
  code: string | undefined,
): code is AnalyticsAlertErrorCode => code != null && ANALYTICS_ALERT_ERROR_CODE_VALUES.has(code);

/**
 * Duck-typed check for an SDK error that carries a `Response` body, including
 * cross-realm cases where the strict `instanceof ResponseError` check fails
 * (e.g. dual-package hazard in tests, or errors originating from a different
 * `@rbx/clients-core` instance). We require both `response` (a `Response`)
 * and a working `clone()` so that callers can still consume the body
 * afterwards.
 */
const isErrorWithCloneableResponse = (error: unknown): error is { response: Response } => {
  if (error instanceof ResponseError) {
    return true;
  }
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return false;
  }
  const { response } = error;
  return (
    typeof response === 'object' &&
    response !== null &&
    'clone' in response &&
    typeof response.clone === 'function'
  );
};

/**
 * Best-effort read of the `errorCode` field from the JSON body of a thrown SDK
 * error. Returns `undefined` for any error that doesn't carry a `Response`
 * body, or whose body cannot be parsed as
 * {@link RawAnalyticsAlertErrorResponse}. Always reads through a `Response`
 * clone so callers can still consume the body if they need to.
 *
 * Use this in mutation `onError` handlers (e.g. to detect any of the
 * {@link AnalyticsAlertErrorCode} values defined by analytics-alerts PR #99)
 * without coupling the caller to the raw SDK runtime.
 */
export const readAnalyticsAlertErrorCode = async (error: unknown): Promise<string | undefined> => {
  if (!isErrorWithCloneableResponse(error)) {
    return undefined;
  }
  try {
    const body: unknown = await error.response.clone().json();
    if (
      typeof body === 'object' &&
      body !== null &&
      'errorCode' in body &&
      typeof body.errorCode === 'string'
    ) {
      return body.errorCode;
    }
    return undefined;
  } catch {
    return undefined;
  }
};

const parseRawFilters = (
  rawFilters: RawAnalyticsAlertFiringMetadata['filter'],
): AnalyticsAlertQueryFilter[] | undefined => {
  if (!rawFilters?.length) {
    return undefined;
  }
  return rawFilters.flatMap((row) =>
    isValidEnumValue(RAQIV2Dimension, row.dimension)
      ? [{ dimension: row.dimension, values: [...row.values] }]
      : [],
  );
};

const parseRawBreakdowns = (
  rawBreakdowns: RawAnalyticsAlertFiringMetadata['breakdown'],
): AnalyticsAlertQueryBreakdown[] | undefined => {
  if (!rawBreakdowns?.length) {
    return undefined;
  }
  const parsed = rawBreakdowns.flatMap((entry) => {
    const dimensions = entry.dimensions.filter((dim): dim is TRAQIV2Dimension =>
      isValidEnumValue(RAQIV2Dimension, dim),
    );
    if (dimensions.length === 0) {
      return [];
    }
    return [{ dimensions }];
  });
  return parsed.length > 0 ? parsed : undefined;
};

const parseRawFiringConditions = (
  rawFiringConditions: RawAnalyticsAlertFiringMetadata['firingCondition'],
): AnalyticsAlertFiringCondition[] =>
  rawFiringConditions.map(({ firingValue, firingDimension }) => {
    const refinedFiringDimension =
      firingDimension && isValidEnumValue(RAQIV2Dimension, firingDimension.dimension)
        ? { dimension: firingDimension.dimension, value: firingDimension.value }
        : undefined;
    return refinedFiringDimension
      ? { firingValue, firingDimension: refinedFiringDimension }
      : { firingValue };
  });

export const parseAnalyticsAlertFiringMetadata = (
  raw: RawAnalyticsAlertFiringMetadata,
): AnalyticsAlertFiringMetadata => ({
  filter: parseRawFilters(raw.filter),
  breakdown: parseRawBreakdowns(raw.breakdown),
  condition: raw.condition,
  firingCondition: parseRawFiringConditions(raw.firingCondition),
});

/**
 * Parse the raw SDK incident detail into the FE shape. Performs the two
 * refinements documented on {@link RawAnalyticsAlertIncidentDetail}: refines
 * the firing-metadata dimensions and lifts the nested `alertConfig` block to
 * top-level fields. `alertConfig.*` is the only source of truth for the
 * lifted fields.
 *
 * Exported so other clients (e.g. the universe annotations client) can stay on
 * the same source of truth without reimplementing the lift.
 */
export const parseSdkIncidentDetail = (
  raw: SdkAnalyticsAlertIncidentDetail,
): RawAnalyticsAlertIncidentDetail => {
  const { alertConfig, firstFiringMetadata, latestFiringMetadata, ...rest } = raw;
  return {
    ...rest,
    firstFiringMetadata: parseAnalyticsAlertFiringMetadata(firstFiringMetadata),
    latestFiringMetadata: parseAnalyticsAlertFiringMetadata(latestFiringMetadata),
    alertId: alertConfig.id,
    alertName: alertConfig.name,
    metric: alertConfig.metric,
    severity: alertConfig.severity,
    description: alertConfig.description,
    interval: alertConfig.interval,
    filter: parseRawFilters(alertConfig.filter),
    breakdown: parseRawBreakdowns(alertConfig.breakdown),
    condition: alertConfig.condition,
  };
};

const configuration = createClientConfiguration('analytics-alert-control-plane', 'bedev2');

const analyticsAlertControlPlaneApi = new AlertsApi(configuration);

export type AnalyticsAlertApiClient = {
  listAlerts: (request: ListAnalyticsAlertsRequest) => Promise<RawAnalyticsAlertDetail[]>;
  listAlertIncidents: (
    request: ListAnalyticsAlertIncidentsRequest,
  ) => Promise<RawAnalyticsAlertIncidentDetail[]>;
  createAlert: (request: CreateAnalyticsAlertRequest) => Promise<RawAnalyticsAlertDetail>;
  updateAlert: (request: UpdateAnalyticsAlertRequest) => Promise<RawAnalyticsAlertDetail>;
  deleteAlert: (request: DeleteAnalyticsAlertRequest) => Promise<void>;
};

const listAlerts = (request: ListAnalyticsAlertsRequest): Promise<RawAnalyticsAlertDetail[]> =>
  analyticsAlertControlPlaneApi.alertsGetAlertDetails(request);

const createAlert = (request: CreateAnalyticsAlertRequest): Promise<RawAnalyticsAlertDetail> => {
  return analyticsAlertControlPlaneApi.alertsCreateAlertConfig(request);
};

const updateAlert = (request: UpdateAnalyticsAlertRequest): Promise<RawAnalyticsAlertDetail> =>
  analyticsAlertControlPlaneApi.alertsUpdateAlertConfig(request);

const deleteAlert = (request: DeleteAnalyticsAlertRequest): Promise<void> =>
  analyticsAlertControlPlaneApi.alertsDeleteAlertConfig(request);

const listAlertIncidents = async (
  request: ListAnalyticsAlertIncidentsRequest,
): Promise<RawAnalyticsAlertIncidentDetail[]> => {
  const responses = await analyticsAlertControlPlaneApi.alertsGetAlertIncidents(request);
  return responses.map(parseSdkIncidentDetail);
};

const analyticsAlertControlPlaneClient: AnalyticsAlertApiClient = {
  listAlerts,
  listAlertIncidents,
  createAlert,
  updateAlert,
  deleteAlert,
};

export default analyticsAlertControlPlaneClient;
