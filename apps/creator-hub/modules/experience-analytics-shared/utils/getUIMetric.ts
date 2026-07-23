import {
  RAQIV2APIMetric,
  RAQIV2Metric,
  RAQIV2UIMetric,
  RAQIV2UIMetricToAPIConfig,
  RAQIV2UIPseudoDimension,
  TRAQIV2UIMetric,
  TRAQIV2UIMetricToAPIConfig,
} from '@rbx/creator-hub-analytics-config';
import { logAnalyticsError } from '@modules/charts-generic';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';

export const getUIMetric = (
  metric: RAQIV2APIMetric | RAQIV2UIMetric | RAQIV2Metric,
): TRAQIV2UIMetric => {
  if (isValidEnumValue(RAQIV2UIMetric, metric) || isValidEnumValue(RAQIV2Metric, metric)) {
    return metric;
  }

  const entries: [RAQIV2UIMetric, TRAQIV2UIMetricToAPIConfig][] = Object.entries(
    RAQIV2UIMetricToAPIConfig,
  ) as [RAQIV2UIMetric, TRAQIV2UIMetricToAPIConfig][];

  const foundEntry = entries.find(([, config]) => {
    const { defaultMetric, dimension } = config;
    if (defaultMetric === metric) {
      return true;
    }

    switch (dimension) {
      case RAQIV2UIPseudoDimension.AggregationType: {
        const aggregationValues = Object.values(config.byAggregationType);
        if (aggregationValues.includes(metric)) {
          return true;
        }
        break;
      }
      case RAQIV2UIPseudoDimension.PercentileType: {
        const percentileValues = Object.values(config.byPercentileType);
        if (percentileValues.includes(metric)) {
          return true;
        }
        break;
      }
      default: {
        const exhaustiveCheck: never = dimension;
        throw new Error(`Unhandled dimension: ${exhaustiveCheck}`);
      }
    }

    return false;
  });

  if (foundEntry) {
    return foundEntry[0];
  }

  // If no UI metric found, log error and throw
  const errorMessage = `No UI metric found for API metric: ${metric}`;
  logAnalyticsError(errorMessage);
  throw new Error(errorMessage);
};

export default getUIMetric;
