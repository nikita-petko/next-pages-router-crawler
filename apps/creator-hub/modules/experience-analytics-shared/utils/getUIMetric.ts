import {
  RAQIV2Metric,
  RAQIV2UIMetric,
  RAQIV2UIMetricToAPIConfig,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import type {
  RAQIV2APIMetric,
  TRAQIV2UIMetric,
  TRAQIV2UIMetricToAPIConfig,
} from '@rbx/creator-hub-analytics-config';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';

export const getUIMetric = (
  metric: RAQIV2APIMetric | RAQIV2UIMetric | RAQIV2Metric,
): TRAQIV2UIMetric => {
  if (isValidEnumValue(RAQIV2UIMetric, metric) || isValidEnumValue(RAQIV2Metric, metric)) {
    return metric;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
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
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
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
