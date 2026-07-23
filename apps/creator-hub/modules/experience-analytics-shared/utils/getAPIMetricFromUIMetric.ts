import {
  RAQIV2UIMetricToAPIConfig,
  RAQIV2UIPseudoDimension,
  type TRAQIV2APIMetric,
  type TRAQIV2UIMetricFanoutDimensionValues,
} from '@rbx/creator-hub-analytics-config';
import type { RAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';

export const getAPIMetricFromUIMetric = (
  givenMetric: RAQIV2UIMetric,
  dimensionValues: TRAQIV2UIMetricFanoutDimensionValues,
): TRAQIV2APIMetric => {
  const config = RAQIV2UIMetricToAPIConfig[givenMetric];
  const fanoutDimension = config.dimension;
  switch (fanoutDimension) {
    case RAQIV2UIPseudoDimension.PercentileType: {
      if (!dimensionValues.percentile) {
        return config.defaultMetric;
      }
      return config.byPercentileType[dimensionValues.percentile];
    }
    case RAQIV2UIPseudoDimension.AggregationType: {
      if (!dimensionValues.aggregationType) {
        return config.defaultMetric;
      }
      return config.byAggregationType[dimensionValues.aggregationType];
    }
    default: {
      const exhaustiveCheck: never = fanoutDimension;
      throw new Error(`Unhandled fanout dimension: ${String(exhaustiveCheck)}`);
    }
  }
};

export const getAllAPIMetricsFromUIMetric = (givenMetric: RAQIV2UIMetric) => {
  const config = RAQIV2UIMetricToAPIConfig[givenMetric];
  const fanoutDimension = config.dimension;
  switch (fanoutDimension) {
    case RAQIV2UIPseudoDimension.PercentileType: {
      return Object.values(config.byPercentileType);
    }
    case RAQIV2UIPseudoDimension.AggregationType: {
      return Object.values(config.byAggregationType);
    }
    default: {
      const exhaustiveCheck: never = fanoutDimension;
      throw new Error(`Unhandled fanout dimension: ${String(exhaustiveCheck)}`);
    }
  }
};

export default getAPIMetricFromUIMetric;
