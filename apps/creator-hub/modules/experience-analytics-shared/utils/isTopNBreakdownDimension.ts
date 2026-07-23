import type {
  TRAQIV2Dimension,
  TUIPseudoDimensionTopNBreakdownConfig,
} from '@rbx/creator-hub-analytics-config';
import {
  RAQIV2PseudoDimensionDisplayConfig,
  RAQIV2UIPseudoDimension,
  RAQIV2UIPseudoDimensionType,
} from '@rbx/creator-hub-analytics-config';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';

export const isTopNBreakdownDimension = (dimension: TRAQIV2Dimension): boolean =>
  isValidEnumValue(RAQIV2UIPseudoDimension, dimension) &&
  RAQIV2PseudoDimensionDisplayConfig[dimension].pseudoDimensionConfig.type ===
    RAQIV2UIPseudoDimensionType.TopNBreakdown;

export const getTopNBreakdownConfig = (
  dimension: TRAQIV2Dimension,
): TUIPseudoDimensionTopNBreakdownConfig | undefined => {
  if (!isValidEnumValue(RAQIV2UIPseudoDimension, dimension)) {
    return undefined;
  }
  const { pseudoDimensionConfig } = RAQIV2PseudoDimensionDisplayConfig[dimension];
  return pseudoDimensionConfig.type === RAQIV2UIPseudoDimensionType.TopNBreakdown
    ? pseudoDimensionConfig
    : undefined;
};
