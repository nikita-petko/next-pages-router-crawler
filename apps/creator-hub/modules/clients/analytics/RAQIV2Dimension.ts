import { isValidEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import {
  RAQIV2Dimension,
  RAQIV2AggregationType,
  RAQIV2PercentileType,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';

export type TRAQIV2UIMetricFanoutDimensionValuesNew = {
  percentileType: RAQIV2PercentileType | null;
  aggregationType: RAQIV2AggregationType | null;
};

export type TRAQIV2BreakdownDimension = RAQIV2Dimension | RAQIV2UIPseudoDimension;
export const isSupportedBreakdownDimension = (
  dimension: string,
): dimension is TRAQIV2BreakdownDimension => {
  return (
    isValidEnumValue(RAQIV2Dimension, dimension) ||
    isValidEnumValue(RAQIV2UIPseudoDimension, dimension)
  );
};
