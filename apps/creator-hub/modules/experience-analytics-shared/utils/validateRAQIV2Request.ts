import {
  RAQIV2DimensionDisplayConfig,
  RAQIV2DimensionValueType,
  RAQIV2MetricToSupportedDimensions,
  RAQIV2MetricToSupportedGranularities,
} from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension, TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import { getUIMetricFromAtomicMetricLike, isComputedMetric } from '../types/ComputedMetric';
import type { RAQIV2UIQueryRequest } from '../types/RAQIV2UIQueryRequest';

/**
 * Client-side RAQI validation errors.
 *
 * Integration with the backend:
 * We intentionally maintain two validation paths:
 *   1. (this module) Early-fail client-side validation for cases where the
 *      codegen'd analytics config already tells us a given request will be
 *      rejected. Prevents wasted round trips and surfaces actionable errors
 *      before the query leaves the browser.
 *   2. Backend error return path (QueryError, see RAQIQueryError on the
 *      frontend): authoritative validation that runs regardless of client
 *      state — catches anything the config hasn't caught up with yet,
 *      honors server-side feature flags, and covers dynamically-allowed
 *      dimension values the client can't know about.
 *
 * Both paths should produce equivalently actionable UI copy for the same
 * class of failure. When adding a new variant here, list the closest backend
 * analog below so we can keep the two in sync; when adding a new backend
 * validation reason, add a matching variant here if the client can cheaply
 * detect the same condition from codegen'd config.
 */
export enum RAQIV2ValidationErrorType {
  /**
   * Metric doesn't support the requested granularity.
   * Backend analog: QueryValidationFailed (2001) from the gateway/operations
   * layer when the RAQI converter rejects the (metric, granularity) pair.
   */
  UnsupportedGranularity = 'unsupported_granularity',
  /**
   * Metric doesn't support breaking down by the requested dimension.
   * Backend analog: QueryValidationFailed (2001), same converter path as
   * UnsupportedGranularity.
   */
  UnsupportedBreakdown = 'unsupported_breakdown',
  /**
   * Metric doesn't support filtering by the requested dimension at all.
   * Backend analog: QueryValidationFailed (2001), same converter path.
   */
  UnsupportedFilter = 'unsupported_filter',
  /**
   * Filter dimension is supported, but one or more requested values are not.
   * Backend analog: QueryValidationFailed (2001) with
   * QueryValidationDetails{ field: FILTER, subject: <dimension>,
   * rejected_values: [...] } populated, thrown from the engine's
   * QueryValidationException and carried over gRPC via the generic
   * validation-error-field / -subject / -value trailers. See
   * RAQIQueryError.validationDetails on the frontend for how we surface the
   * structured payload.
   */
  UnsupportedFilterValue = 'unsupported_filter_value',
}

export class RAQIV2ValidationError extends Error {
  type: RAQIV2ValidationErrorType;

  constructor(
    type: RAQIV2ValidationErrorType,
    msg: string,
    public metric: TRAQIV2UIMetric,
    public dimension?: TRAQIV2Dimension,
  ) {
    super(msg);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, RAQIV2ValidationError.prototype);
    this.type = type;
  }
}

/**
 * Returns the codegen'd filter-value support map for a dimension as a
 * `Map<string, boolean>`, or `undefined` if the dimension is not
 * Enum-typed or doesn't declare one. Dynamic and DynamicWithPreset
 * dimensions legitimately lack a static map — those cases rely on the
 * backend error return path.
 *
 * The source map has narrow string-literal keys (`Partial<Record<TDimValues,
 * boolean>>`) that TypeScript won't let us index with an arbitrary
 * string. Rather than widening with an `as` assertion, we project into a
 * plain `Map<string, boolean>` via `Object.entries` with a `typeof`
 * guard on the value — that keeps the key/value types honest at the
 * boundary and drops any `undefined` entries from optional keys.
 */
const getEnumFilterSupport = (dimension: TRAQIV2Dimension): Map<string, boolean> | undefined => {
  const config = RAQIV2DimensionDisplayConfig[dimension];
  if (!config || config.valueType !== RAQIV2DimensionValueType.Enum) {
    return undefined;
  }
  const { filterSupported } = config;
  if (!filterSupported) {
    return undefined;
  }
  const map = new Map<string, boolean>();
  Object.entries(filterSupported).forEach(([value, supported]) => {
    if (typeof supported === 'boolean') {
      map.set(value, supported);
    }
  });
  return map;
};

export const validateRAQIV2Request = (request: RAQIV2UIQueryRequest): RAQIV2ValidationError[] => {
  const errors: RAQIV2ValidationError[] = [];
  const { metric, granularity, breakdown, filter } = request;

  // Computed metrics are validated by ACE DAG validation.
  if (isComputedMetric(metric)) {
    return errors;
  }

  const uiMetric = getUIMetricFromAtomicMetricLike(metric);

  // Validate every granularity, including None, against the generated metric contract.
  const metricGranularities = RAQIV2MetricToSupportedGranularities[uiMetric];
  if (metricGranularities && !metricGranularities.includes(granularity)) {
    errors.push(
      new RAQIV2ValidationError(
        RAQIV2ValidationErrorType.UnsupportedGranularity,
        `Metric ${uiMetric} does not support granularity ${granularity}. Supported granularities: ${metricGranularities.join(
          ', ',
        )}`,
        uiMetric,
        undefined,
      ),
    );
  }

  // Validate breakdown dimensions
  const metricDimensions = RAQIV2MetricToSupportedDimensions[uiMetric];
  if (metricDimensions && breakdown) {
    breakdown.forEach((dimension) => {
      if (!metricDimensions.includes(dimension)) {
        errors.push(
          new RAQIV2ValidationError(
            RAQIV2ValidationErrorType.UnsupportedBreakdown,
            `Metric ${uiMetric} does not support breakdown dimension ${dimension}. Supported dimensions: ${metricDimensions.join(
              ', ',
            )}`,
            uiMetric,
            dimension,
          ),
        );
      }
    });
  }

  // Validate filter dimensions
  if (metricDimensions && filter) {
    filter.forEach(({ dimension }) => {
      if (!metricDimensions.includes(dimension)) {
        errors.push(
          new RAQIV2ValidationError(
            RAQIV2ValidationErrorType.UnsupportedFilter,
            `Metric ${uiMetric} does not support filter dimension ${dimension}. Supported dimensions: ${metricDimensions.join(
              ', ',
            )}`,
            uiMetric,
            dimension,
          ),
        );
      }
    });
  }

  // Early-fail check against the codegen'd filterSupported map. The backend
  // does its own authoritative check (and returns QueryValidationFailed/2001
  // with QueryValidationDetails { field: FILTER, ... } on failure), but
  // running it here lets stale deep-links short-circuit before hitting the
  // network. Dynamic/DynamicWithPreset dimensions are skipped because their
  // allowed values aren't known client-side — those cases rely solely on
  // the backend error return path.
  if (filter) {
    filter.forEach(({ dimension, values }) => {
      const filterSupported = getEnumFilterSupport(dimension);
      if (!filterSupported) {
        return;
      }
      const unsupportedValues = values.filter((value) => filterSupported.get(value) === false);
      if (unsupportedValues.length > 0) {
        errors.push(
          new RAQIV2ValidationError(
            RAQIV2ValidationErrorType.UnsupportedFilterValue,
            `Dimension ${dimension} does not support filter value(s) ${unsupportedValues.join(
              ', ',
            )} for metric ${uiMetric}.`,
            uiMetric,
            dimension,
          ),
        );
      }
    });
  }

  return errors;
};

export default validateRAQIV2Request;
