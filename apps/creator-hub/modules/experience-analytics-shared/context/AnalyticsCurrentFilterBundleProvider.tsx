import React, { createContext, useContext, FC, useMemo, useState } from 'react';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { useRouter } from 'next/router';
import { RAQIV2ChartResource, RAQIV2QueryFilter } from '@modules/clients/analytics';
import { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import emptyFunction from '../constants/emptyFunction';
import {
  NonRAQIUIFilterDimension,
  getQueryForDimension,
  mergeUIFiltersIntoQueryParams,
  queryParamsToUIFilters,
  UIFilters,
  UIFilterDimension,
  filterBarDimensionToQueryKey,
} from '../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import {
  useLogFiltersChangedCallback,
  useRouterLoggingInfo,
} from '../logging/experienceAnalyticsLogger';
import legacyFiltersToRAQIV2 from '../adapters/legacyFiltersToRAQIV2';
import { getFilterBarDimensionForRAQIV2Dimension } from '../constants/FilterDimensionConfig';

const DefaultAnalyticsCurrentFilterBundleRaw = {
  knownFilters: [],
  onKnownFiltersChange: emptyFunction,
  onUnsupportedDimensionFilterDelete: emptyFunction,
};
type AnalyticsCurrentFilterBundleRaw = {
  knownFilters: UIFilters;
  onKnownFiltersChange: (
    filters: UIFilters,
    knownDimensions: Readonly<Array<UIFilterDimension>>,
  ) => void;
  onUnsupportedDimensionFilterDelete: (dimension: TRAQIV2Dimension) => void;
};

// Exported so that Layer 2 (PageConfigAwareFilterProvider) can provide to this same context
export const AnalyticsCurrentFilterBundleContext = createContext<AnalyticsCurrentFilterBundleRaw>(
  DefaultAnalyticsCurrentFilterBundleRaw,
);
AnalyticsCurrentFilterBundleContext.displayName = 'ExperienceAnalyticsCurrentFilter';

export type ExperienceAnalyticsCurrentFilterBundle = {
  filters: UIFilters;
  onFiltersChange: (filters: UIFilters) => void;
  onUnsupportedDimensionFilterDelete: (dimension: TRAQIV2Dimension) => void;
  raqiFilters: RAQIV2QueryFilter[];
};

/**
 * In order to allow for filter dimensions to cross page boundaries nicely, we actually retrieve
 * and change a superset of the query params that the current page "knows" about.
 *
 * This way, if you leave the performance page to visit another filtered page (user acquisition),
 * and you return to the performance page after poking around with the UA filters, your filters on
 * unrelated dimensions won't be affected.
 *
 * NOTE(gperkins@20230322): It's important to pass a stable reference in as knownDimensions here;
 * otherwise our memoization fails into an infinite loop.
 * @deprecated -- call useRAQIAnalyticsCurrentFilterBundle or useNonRAQIAnalyticsCurrentFilterBundle instead
 */
export const useAnalyticsCurrentFilterBundle = (
  legacyDimensions: ReadonlyArray<NonRAQIUIFilterDimension>,
  givenRaqiDimensions?: ReadonlyArray<TRAQIV2Dimension>,
  defaultFilters?: RAQIV2QueryFilter[],
): ExperienceAnalyticsCurrentFilterBundle => {
  const [isInitialization, setIsInitialization] = useState<boolean>(true);
  const { knownFilters, onKnownFiltersChange, onUnsupportedDimensionFilterDelete } = useContext(
    AnalyticsCurrentFilterBundleContext,
  );
  const raqiFilters = useMemo(() => {
    return legacyFiltersToRAQIV2(knownFilters);
  }, [knownFilters]);

  const knownDimensions = useMemo(() => {
    const raqiDimensions =
      givenRaqiDimensions?.flatMap((dim) => getFilterBarDimensionForRAQIV2Dimension(dim) || []) ??
      [];
    return [...legacyDimensions, ...(raqiDimensions ?? [])];
  }, [legacyDimensions, givenRaqiDimensions]);

  if (isInitialization && defaultFilters) {
    const initFilters = defaultFilters.filter(
      (filter) =>
        knownDimensions.some((dim) => dim === filter.dimension) &&
        !knownFilters.some((knownFilter) => knownFilter.dimension === filter.dimension),
    );
    if (initFilters.length > 0) {
      onKnownFiltersChange([...knownFilters, ...initFilters], knownDimensions);
    }
    setIsInitialization(false);
  }

  return useMemo(() => {
    const knownDimensionSet = new Set<UIFilterDimension>(knownDimensions);
    const filters = knownFilters.filter(({ dimension }) => knownDimensionSet.has(dimension));
    const onFiltersChange = (newFilters: UIFilters) =>
      onKnownFiltersChange(newFilters, knownDimensions);
    return { filters, onFiltersChange, raqiFilters, onUnsupportedDimensionFilterDelete };
  }, [
    knownDimensions,
    knownFilters,
    raqiFilters,
    onUnsupportedDimensionFilterDelete,
    onKnownFiltersChange,
  ]);
};

export const useNonRAQIAnalyticsCurrentFilterBundle = (
  legacyDimensions: ReadonlyArray<NonRAQIUIFilterDimension>,
): ExperienceAnalyticsCurrentFilterBundle => {
  // eslint-disable-next-line deprecation/deprecation -- this is the transition path
  return useAnalyticsCurrentFilterBundle(legacyDimensions);
};

const noLegacyFilterBarDimensions: ReadonlyArray<NonRAQIUIFilterDimension> = [];
export const useRAQIAnalyticsCurrentFilterBundle = (
  raqiDimensions: ReadonlyArray<TRAQIV2Dimension>,
  defaultFilters?: RAQIV2QueryFilter[],
): ExperienceAnalyticsCurrentFilterBundle => {
  // eslint-disable-next-line deprecation/deprecation -- this is the transition path
  return useAnalyticsCurrentFilterBundle(
    noLegacyFilterBarDimensions,
    raqiDimensions,
    defaultFilters,
  );
};

const filterQueryParamKeys = Object.values(filterBarDimensionToQueryKey);
const AnalyticsCurrentFilterBundleProvider: FC<
  React.PropsWithChildren<{
    resource: RAQIV2ChartResource;
  }>
> = ({ children, resource }) => {
  const router = useRouterLoggingInfo(useRouter());
  const logger = useLogFiltersChangedCallback(router, resource);
  const [rawFilterQueryParams, setRawFilterQueryParams] = useQueryParams(filterQueryParamKeys, {
    scroll: false,
  });
  const knownFilters = useMemo(
    () => queryParamsToUIFilters(rawFilterQueryParams),
    [rawFilterQueryParams],
  );

  const bundle = useMemo(() => {
    const onKnownFiltersChange = (
      newFilters: UIFilters,
      knownDimensions: Readonly<Array<UIFilterDimension>>,
    ) => {
      const newQueryParams = mergeUIFiltersIntoQueryParams(
        newFilters,
        rawFilterQueryParams,
        knownDimensions,
      );
      const newKnownFilters = queryParamsToUIFilters(newQueryParams);
      // NOTE(gperkins@20230322) always log all filters, not just the known ones
      logger(knownFilters, newKnownFilters);
      setRawFilterQueryParams(newQueryParams);
    };
    const onUnsupportedDimensionFilterDelete = (dimension: TRAQIV2Dimension) => {
      const queryParams = { [getQueryForDimension(dimension)]: null };
      setRawFilterQueryParams(queryParams);
    };
    return { knownFilters, onKnownFiltersChange, onUnsupportedDimensionFilterDelete };
  }, [knownFilters, logger, rawFilterQueryParams, setRawFilterQueryParams]);

  return (
    <AnalyticsCurrentFilterBundleContext.Provider value={bundle}>
      {children}
    </AnalyticsCurrentFilterBundleContext.Provider>
  );
};
export default AnalyticsCurrentFilterBundleProvider;
