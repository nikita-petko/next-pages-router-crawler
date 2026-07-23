import {
  RAQIV2UIMetric,
  RAQIV2UIMetricToAPIConfig,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import { TRAQIV2UIMetricFanoutDimensionValuesNew } from '@modules/clients/analytics';

export const getAPIMetricFromUIMetric = (
  givenMetric: RAQIV2UIMetric,
  dimensionValues: TRAQIV2UIMetricFanoutDimensionValuesNew,
) => {
  const config = RAQIV2UIMetricToAPIConfig[givenMetric];
  const fanoutDimension = config.dimension;
  switch (fanoutDimension) {
    case RAQIV2UIPseudoDimension.PercentileType: {
      if (!dimensionValues.percentileType) return config.defaultMetric;
      return config.byPercentileType[dimensionValues.percentileType];
    }
    case RAQIV2UIPseudoDimension.AggregationType: {
      if (!dimensionValues.aggregationType) return config.defaultMetric;
      return config.byAggregationType[dimensionValues.aggregationType];
    }
    default: {
      const exhaustiveCheck: never = fanoutDimension;
      throw new Error(`Unhandled fanout dimension: ${exhaustiveCheck}`);
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
      throw new Error(`Unhandled fanout dimension: ${exhaustiveCheck}`);
    }
  }
};

export default getAPIMetricFromUIMetric;
