import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import { RAQIV2Dimension, RAQIV2UIPseudoDimension } from '@rbx/creator-hub-analytics-config';
import {
  raqiSupportedFilterBarDimensions,
  TSupportedFilterBarDimensions,
} from '../constants/FilterDimensionConfig';
import { NonRAQIUIDimension } from '../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import RAQIV2FilterRenderPosition from '../types/RAQIV2FilterRenderPosition';

// If not present, uses RAQIV2FilterRenderPosition.FilterDrawer by default
export const FilterBarDimensionToFilterPosition: Partial<
  Record<TSupportedFilterBarDimensions, RAQIV2FilterRenderPosition>
> = {
  [RAQIV2Dimension.CustomEventName]: RAQIV2FilterRenderPosition.PreControl,
  [RAQIV2Dimension.Place]: RAQIV2FilterRenderPosition.Controls,
  [RAQIV2UIPseudoDimension.AggregationType]: RAQIV2FilterRenderPosition.ControlsRight,
  [RAQIV2Dimension.AbuseChannel]: RAQIV2FilterRenderPosition.Controls,
  [RAQIV2Dimension.LocationId]: RAQIV2FilterRenderPosition.Controls,
};

/**
 * Used to get the position on a page where the filter should render based on its dimension
 * @param dimension a filter dimension
 * @returns a position on page where the filter should render
 */
export default function filterPositionOnPageByDimension(
  dimension: TSupportedFilterBarDimensions,
): RAQIV2FilterRenderPosition {
  if (isValidArrayEnumValue(raqiSupportedFilterBarDimensions, dimension)) {
    return FilterBarDimensionToFilterPosition[dimension] ?? RAQIV2FilterRenderPosition.FilterDrawer;
  }

  switch (dimension) {
    case NonRAQIUIDimension.Version:
    case NonRAQIUIDimension.Text:
      return RAQIV2FilterRenderPosition.Controls;
    default: {
      const exhaustiveCheck: never = dimension;
      throw new Error(`Where should filter dimension ${exhaustiveCheck} render?`);
    }
  }
}
