import {
  RAQIV2MetricGranularity,
  RAQIV2MetricToSupportedDimensions,
  RAQIV2MetricToSupportedGranularities,
  TRAQIV2UIMetric,
  TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import { RAQIV2UIQueryRequest } from '../types/RAQIV2UIQueryRequest';
import { isComputedMetric } from '../types/ComputedMetric';

export enum RAQIV2ValidationErrorType {
  UnsupportedGranularity = 'unsupported_granularity',
  UnsupportedBreakdown = 'unsupported_breakdown',
  UnsupportedFilter = 'unsupported_filter',
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

export const validateRAQIV2Request = (request: RAQIV2UIQueryRequest): RAQIV2ValidationError[] => {
  const errors: RAQIV2ValidationError[] = [];
  const { metric, granularity, breakdown, filter } = request;

  // Computed metrics are validated by ACE DAG validation.
  if (isComputedMetric(metric)) {
    return errors;
  }

  // Validate granularity against codegen-defined supported granularities.
  // RAQIV2MetricGranularity.None is always valid client-side (cumulative queries).
  const metricGranularities = RAQIV2MetricToSupportedGranularities[metric];
  if (
    metricGranularities &&
    granularity !== RAQIV2MetricGranularity.None &&
    !metricGranularities.includes(granularity)
  ) {
    errors.push(
      new RAQIV2ValidationError(
        RAQIV2ValidationErrorType.UnsupportedGranularity,
        `Metric ${metric} does not support granularity ${granularity}. Supported granularities: ${metricGranularities.join(
          ', ',
        )}`,
        metric,
        undefined,
      ),
    );
  }

  // Validate breakdown dimensions
  const metricDimensions = RAQIV2MetricToSupportedDimensions[metric];
  if (metricDimensions && breakdown) {
    breakdown.forEach((dimension) => {
      if (!metricDimensions.includes(dimension)) {
        errors.push(
          new RAQIV2ValidationError(
            RAQIV2ValidationErrorType.UnsupportedBreakdown,
            `Metric ${metric} does not support breakdown dimension ${dimension}. Supported dimensions: ${metricDimensions.join(
              ', ',
            )}`,
            metric,
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
            `Metric ${metric} does not support filter dimension ${dimension}. Supported dimensions: ${metricDimensions.join(
              ', ',
            )}`,
            metric,
            dimension,
          ),
        );
      }
    });
  }

  return errors;
};

export default validateRAQIV2Request;
