import { RAQIV2Dimension, RAQIV2UIPseudoDimension } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { RAQIMetricFilter } from '@modules/clients/analytics';
import type { TAlertAnnotationSeverityDimension } from '../../constants/alertAnnotationConfigs';
import { AlertAnnotationSeverityDimension } from '../../constants/alertAnnotationConfigs';

export enum NonRAQIUIDimension {
  Version = 'Version',
  Text = 'Text',
  // ExperienceSubscriptionsDimensions
  Subscription = 'Subscription',
  // avatarFilterDimensions
  AvatarItemCategory = 'AvatarItemCategory',
  SalesType = 'SalesType',
  // recommendedEventsLiveEventsFilterDimensions
  UserId = 'UserId',
}

export type NonRAQIUIFilterDimension = NonRAQIUIDimension | TAlertAnnotationSeverityDimension;
export type UIFilterDimension = NonRAQIUIFilterDimension | TRAQIV2Dimension;
export type UIFilter = RAQIMetricFilter<UIFilterDimension>;
export type UIFilters = UIFilter[];

export function getCurrentDimensionValues<T extends string>(
  filters: Readonly<UIFilters>,
  target: UIFilterDimension,
  defaultOptions: T[],
): T[] {
  for (const { dimension, values } of filters) {
    if (dimension === target) {
      if (values.length) {
        // Filter values are stored as `string[]` because the dimension type is
        // erased at the storage layer; the caller asserts the narrower `T` via
        // the `defaultOptions` shape, which is the documented contract here.
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- documented contract above
        return values as T[];
      }
      break;
    }
  }
  return defaultOptions;
}

export function getCurrentDimensionSingleValue<T extends string>(
  filters: Readonly<UIFilters>,
  target: UIFilterDimension,
  defaultOption: T,
): T {
  const [value] = getCurrentDimensionValues(filters, target, [defaultOption]);
  return value;
}

export function updateFilterValues<T extends string>(
  filters: Readonly<UIFilters>,
  target: UIFilterDimension,
  values: T[] | null, // null means remove the filter for this dimension
): UIFilters {
  const shouldRemove = values === null || values.length === 0;
  const result: UIFilters = [];
  let edited = false;
  filters.forEach((filter) => {
    const { dimension } = filter;
    if (dimension === target) {
      if (!shouldRemove) {
        result.push({
          dimension,
          values,
        });
      }
      edited = true;
    } else {
      result.push(filter);
    }
  });
  if (!edited && !shouldRemove) {
    result.push({ dimension: target, values });
  }
  return result;
}

export function updateFilterSingleValue<T extends string>(
  filters: Readonly<UIFilters>,
  target: UIFilterDimension,
  value: T | null, // null means remove the filter for this dimension
): UIFilters {
  return updateFilterValues(filters, target, value !== null ? [value] : null);
}

// Dimensions whose selections depend on another dimension. When the parent
// dimension's filter is changed (e.g. Place), every dependent dimension is
// cleared because the previously chosen value(s) may no longer be valid for
// the new parent selection.
const DEPENDENT_FILTERS_BY_DIMENSION: Partial<Record<UIFilterDimension, UIFilterDimension[]>> = {
  [RAQIV2Dimension.Place]: [
    RAQIV2Dimension.PlaceVersion,
    RAQIV2Dimension.FirstSeenPlaceVersion,
    NonRAQIUIDimension.Version,
  ],
};

export function clearDependentFiltersOnDimensionChange(
  filters: Readonly<UIFilters>,
  changedDimension: UIFilterDimension,
): UIFilters {
  const dependents = DEPENDENT_FILTERS_BY_DIMENSION[changedDimension];
  if (!dependents || dependents.length === 0) {
    return [...filters];
  }
  return dependents.reduce<UIFilters>(
    (acc, dependent) => updateFilterValues(acc, dependent, null),
    [...filters],
  );
}

// Result of useQueryParams and parameter for its callback
// TODO(gperkins@20230322): we could probably enforce that FilterQueryKey is built like `filter_*`
type FilterQueryKey = string;
type QueryParams = { [k: FilterQueryKey]: string | string[] | null | undefined };

const queryKeyToFilterBarDimension: { [k: string]: UIFilterDimension } = {};
export const filterBarDimensionToQueryKey: Partial<Record<UIFilterDimension, string>> = {};
[
  ...Object.values(NonRAQIUIDimension),
  ...Object.values(RAQIV2Dimension),
  ...Object.values(RAQIV2UIPseudoDimension),
  ...Object.values(AlertAnnotationSeverityDimension),
].forEach((dim) => {
  const queryKey = `filter_${dim}`;
  queryKeyToFilterBarDimension[queryKey] = dim;
  filterBarDimensionToQueryKey[dim] = queryKey;
});
export const queryParamsToUIFilters = (rawFilterParams: Readonly<QueryParams>): UIFilters => {
  const result: UIFilters = [];
  Object.keys(rawFilterParams).forEach((urlKey) => {
    const rawValue = rawFilterParams[urlKey];
    const uiDimension = queryKeyToFilterBarDimension[urlKey];
    if (!rawValue || !uiDimension) {
      return;
    } // skip nullish or bad URL key
    if (Array.isArray(rawValue)) {
      result.push({ dimension: uiDimension, values: rawValue });
    } else {
      result.push({ dimension: uiDimension, values: [rawValue] });
    }
  });
  return result.map((filter) => {
    const { dimension, values } = filter;
    if (dimension === RAQIV2Dimension.Place) {
      return {
        dimension,
        values: values.map((value) => {
          // if we see a number within parentheses e.g. "thing (123)", unpack it
          // we also need to match -1
          const match = value.match(/\((\d+|-1)\)/);
          // otherwise just return the raw string
          return match ? match[1] : value;
        }),
      };
    }
    return filter;
  });
};

export const getQueryForDimension = (dimension: UIFilterDimension): FilterQueryKey => {
  return `filter_${dimension}`;
};

export const mergeUIFiltersIntoQueryParams = (
  newFilters: Readonly<UIFilters>,
  priorRawParams: Readonly<QueryParams>,
  knownDimensions: Readonly<Array<UIFilterDimension>>,
): QueryParams => {
  const remainingKnownDimensions = new Set<UIFilterDimension>(knownDimensions);
  const result: QueryParams = {};
  newFilters.forEach(({ dimension, values }) => {
    result[getQueryForDimension(dimension)] = values;
    // NOTE(gperkins@ 20230606): if it's not actually a UIFilterDimension, delete won't matter here.
    remainingKnownDimensions.delete(dimension);
  });
  const unsetQueryKeys = new Set<FilterQueryKey>();
  remainingKnownDimensions.forEach((dimension: UIFilterDimension) => {
    // NOTE(gperkins@20230322): clear out any known filters that were no longer set in the UI
    unsetQueryKeys.add(getQueryForDimension(dimension));
  });
  Object.keys(priorRawParams).forEach((queryKey: FilterQueryKey) => {
    if (unsetQueryKeys.has(queryKey)) {
      result[queryKey] = undefined;
    } else if (!Object.hasOwn(result, queryKey)) {
      // NOTE(gperkins@20230322): if we are not unsetting it, and not set already, use prior value
      result[queryKey] = priorRawParams[queryKey];
    }
  });
  return result;
};

export function getFilterValuesForDimension<DimensionValue extends string>(
  filters: UIFilters,
  dim: UIFilterDimension,
  defaultValues: DimensionValue[] | null,
): DimensionValue[] | null {
  const matchingFilter = filters.filter((filter) => {
    return filter.dimension === dim;
  });
  if (matchingFilter && matchingFilter[0]?.values) {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- assume dimension values are correct
    return matchingFilter[0].values as DimensionValue[];
  }
  return defaultValues;
}

export function getFilterValueForDimension<DimensionValue extends string>(
  filters: UIFilters,
  dim: UIFilterDimension,
  defaultValue: DimensionValue | null,
): DimensionValue | null {
  const values = getFilterValuesForDimension(filters, dim, defaultValue ? [defaultValue] : []);

  return values?.[0] ?? null;
}

/**
 * Used to get the list of filter values after a user performs an update.
 *
 * @param current - existing filter values
 * @param given - filter values provided by user
 * @param blankOption - option used to clear all values
 * @param defaultOptions - options rendered as default values
 */
export function getNewFilterValues<T extends string>(
  current: T[],
  given: T[],
  blankOption: T,
  defaultOptions?: T[],
): T[] | null {
  if (given.length === 0 && current.length === 0) {
    // No filter values specified, and user is not clearing the current default option
    return defaultOptions ?? null;
  }

  if (
    (!current.includes(blankOption) && given.includes(blankOption)) ||
    (current.length > 0 && given.length === 0)
  ) {
    // Reset to blank option if either:
    // 1. User clicks on the blank option, or
    // 2. User clears the default options manually
    return [blankOption];
  }

  // Update filters with new values
  return given.filter((option) => option !== blankOption);
}
