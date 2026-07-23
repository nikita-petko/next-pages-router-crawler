import { RAQIV2Dimension, RAQIV2UIPseudoDimension } from '@rbx/creator-hub-analytics-config';
import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { TSupportedFilterBarDimensions } from '../constants/FilterDimensionConfig';
import { raqiSupportedFilterBarDimensions } from '../constants/FilterDimensionConfig';
import { NonRAQIUIDimension } from '../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import RAQIV2FilterRenderPosition from '../types/RAQIV2FilterRenderPosition';

// If not present, uses RAQIV2FilterRenderPosition.FilterDrawer by default
export const FilterBarDimensionToFilterPosition: Partial<
  Record<TSupportedFilterBarDimensions, RAQIV2FilterRenderPosition>
> = {
  [RAQIV2Dimension.CustomEventName]: RAQIV2FilterRenderPosition.PreControl,
  [RAQIV2Dimension.Keyword]: RAQIV2FilterRenderPosition.Controls,
  [RAQIV2Dimension.Place]: RAQIV2FilterRenderPosition.Controls,
  [RAQIV2Dimension.AlertId]: RAQIV2FilterRenderPosition.Controls,
  [RAQIV2Dimension.PlaceVersion]: RAQIV2FilterRenderPosition.Controls,
  [RAQIV2Dimension.FirstSeenPlaceVersion]: RAQIV2FilterRenderPosition.Controls,
  [RAQIV2UIPseudoDimension.AggregationType]: RAQIV2FilterRenderPosition.ControlsRight,
  [RAQIV2Dimension.AbuseChannel]: RAQIV2FilterRenderPosition.Controls,
  [RAQIV2Dimension.LocationId]: RAQIV2FilterRenderPosition.Controls,
  [RAQIV2Dimension.JourneyVersion]: RAQIV2FilterRenderPosition.Controls,
  [RAQIV2Dimension.JourneyName]: RAQIV2FilterRenderPosition.PreControl,
};

// Dimensions in this set render as a searchable multi-select autocomplete
// instead of the default FilterStringChoice when in Controls / ControlsRight /
// PreControl positions. Other dimensions in those positions are unaffected.
export const SearchableControlsFilterBarDimensions: ReadonlySet<TSupportedFilterBarDimensions> =
  new Set<TSupportedFilterBarDimensions>([RAQIV2Dimension.AlertId]);

/**
 * Per-page overrides for `FilterBarDimensionToFilterPosition`. Keyed by any
 * supported filter-bar dimension; entries take precedence over the global map.
 * Use this to relocate a dimension on a single page (e.g. moving Place and
 * PlaceVersion to `ControlsRow2` on ErrorReportPageV2) without affecting other
 * surfaces that share the same dimension.
 */
export type FilterPositionOverrides = Partial<
  Record<TSupportedFilterBarDimensions, RAQIV2FilterRenderPosition>
>;

/**
 * Used to get the position on a page where the filter should render based on its dimension
 * @param dimension a filter dimension
 * @param overrides optional per-page overrides that take precedence over the global map
 * @returns a position on page where the filter should render
 */
export default function filterPositionOnPageByDimension(
  dimension: TSupportedFilterBarDimensions,
  overrides?: FilterPositionOverrides,
): RAQIV2FilterRenderPosition {
  const overridden = overrides?.[dimension];
  if (overridden !== undefined) {
    return overridden;
  }

  if (isValidArrayEnumValue(raqiSupportedFilterBarDimensions, dimension)) {
    return FilterBarDimensionToFilterPosition[dimension] ?? RAQIV2FilterRenderPosition.FilterDrawer;
  }

  switch (dimension) {
    case NonRAQIUIDimension.Version:
    case NonRAQIUIDimension.Text:
      return RAQIV2FilterRenderPosition.Controls;
    default: {
      const exhaustiveCheck: never = dimension;
      throw new Error(`Where should filter dimension ${String(exhaustiveCheck)} render?`);
    }
  }
}
