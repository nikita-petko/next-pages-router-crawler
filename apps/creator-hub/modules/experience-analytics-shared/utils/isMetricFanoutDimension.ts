import {
  RAQIV2DimensionDisplayConfig,
  RAQIV2UIPseudoDimension,
  RAQIV2UIPseudoDimensionType,
} from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { hasMetricVariantFanout, type MetricVariant } from './metricVariant';

const isMetricFanoutDimension = (dimension: TRAQIV2Dimension): boolean =>
  isValidEnumValue(RAQIV2UIPseudoDimension, dimension) &&
  RAQIV2DimensionDisplayConfig[dimension].pseudoDimensionConfig.type ===
    RAQIV2UIPseudoDimensionType.MetricFanout;

export const hasMetricFanoutBreakdown = (
  breakdown: readonly TRAQIV2Dimension[] | undefined,
  metricVariant?: MetricVariant | null,
): boolean => hasMetricVariantFanout(metricVariant, breakdown);

export default isMetricFanoutDimension;
