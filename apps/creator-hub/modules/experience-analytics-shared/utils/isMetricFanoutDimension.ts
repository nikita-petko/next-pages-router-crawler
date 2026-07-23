import {
  TRAQIV2Dimension,
  RAQIV2DimensionDisplayConfig,
  RAQIV2UIPseudoDimensionType,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';

const isMetricFanoutDimension = (dimension: TRAQIV2Dimension): boolean =>
  isValidEnumValue(RAQIV2UIPseudoDimension, dimension) &&
  RAQIV2DimensionDisplayConfig[dimension].pseudoDimensionConfig.type ===
    RAQIV2UIPseudoDimensionType.MetricFanout;

export default isMetricFanoutDimension;
