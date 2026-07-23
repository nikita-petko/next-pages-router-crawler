/**
 * Layer 1: Raw Analytics Query Params Provider
 *
 * This provider handles parsing and setting query params WITHOUT any defaulting logic.
 * It distinguishes between "unset" (undefined) and explicitly set values.
 *
 * Key differences from existing providers:
 * - No legacy migration logic
 * - No defaulting based on page key
 * - Clearly distinguishes undefined (unset) from actual values
 * - Provides raw setters that directly update URL
 */
import React, { createContext, useContext, useMemo, useCallback, type FC } from 'react';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import type { AnnotationType } from '@modules/clients/analytics/annotations/annotations';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import {
  filterBarDimensionToQueryKey,
  queryParamsToUIFilters,
  mergeUIFiltersIntoQueryParams,
  getQueryForDimension,
} from '../../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import type { TUIGranularity } from '../../utils/seriesGranularities';
import { uiGranularityToQueryGranularity } from '../AnalyticsCurrentGranularityProvider';
import {
  BREAKDOWN_NONE_SENTINEL,
  parseRangeType,
  parseTimestamp,
  parseBreakdown,
  parseGranularity,
  parseSingleDateType,
  parseAnnotations,
} from './queryParamParsers';
import type { RawAnalyticsQueryParamsBundle } from './types';

export const RawAnalyticsQueryParamsContext = createContext<RawAnalyticsQueryParamsBundle | null>(
  null,
);
RawAnalyticsQueryParamsContext.displayName = 'RawAnalyticsQueryParamsContext';

// All query param keys we need to read
const dateRangeQueryKeys = [
  AnalyticsQueryParams.MinTime,
  AnalyticsQueryParams.MaxTime,
  AnalyticsQueryParams.RangeType,
] as const;

const singleDateQueryKeys = [
  AnalyticsQueryParams.SingleDateType,
  AnalyticsQueryParams.SingleDateTime,
] as const;

const breakdownQueryKeys = [AnalyticsQueryParams.Breakdown] as const;

const granularityQueryKeys = [AnalyticsQueryParams.Granularity] as const;

const annotationQueryKeys = [
  AnalyticsQueryParams.Annotation,
  AnalyticsQueryParams.FilterAnnotation, // legacy key
] as const;

const filterQueryParamKeys = Object.values(filterBarDimensionToQueryKey).filter(
  (key): key is string => key !== undefined,
);

export const RawAnalyticsQueryParamsProvider: FC<React.PropsWithChildren> = ({ children }) => {
  // Read all query params
  const [dateRangeParams, setDateRangeParams] = useQueryParams([...dateRangeQueryKeys]);
  const [singleDateParams, setSingleDateParams] = useQueryParams([...singleDateQueryKeys]);
  const [breakdownParams, setBreakdownParams] = useQueryParams([...breakdownQueryKeys]);
  const [granularityParams, setGranularityParams] = useQueryParams([...granularityQueryKeys]);
  const [filterParams, setFilterParams] = useQueryParams(filterQueryParamKeys, { scroll: false });
  const [annotationParams, setAnnotationParams] = useQueryParams([...annotationQueryKeys]);

  // Parse date range values
  const rangeType = useMemo(
    () => parseRangeType(dateRangeParams[AnalyticsQueryParams.RangeType]),
    [dateRangeParams],
  );
  const minTime = useMemo(
    () => parseTimestamp(dateRangeParams[AnalyticsQueryParams.MinTime]),
    [dateRangeParams],
  );
  const maxTime = useMemo(
    () => parseTimestamp(dateRangeParams[AnalyticsQueryParams.MaxTime]),
    [dateRangeParams],
  );
  // Parse single date values
  const singleDateType = useMemo(
    () => parseSingleDateType(singleDateParams[AnalyticsQueryParams.SingleDateType]),
    [singleDateParams],
  );
  const singleDateTime = useMemo(
    () => parseTimestamp(singleDateParams[AnalyticsQueryParams.SingleDateTime]),
    [singleDateParams],
  );

  // Parse breakdown
  const breakdown = useMemo(
    () => parseBreakdown(breakdownParams[AnalyticsQueryParams.Breakdown]),
    [breakdownParams],
  );

  // Parse granularity
  const granularity = useMemo(
    () => parseGranularity(granularityParams[AnalyticsQueryParams.Granularity]),
    [granularityParams],
  );

  // Parse filters
  const filters = useMemo(() => queryParamsToUIFilters(filterParams), [filterParams]);

  // Parse annotations (check both new and legacy query params)
  const annotations = useMemo(() => {
    // Prefer the new 'annotation' param, fall back to legacy 'filter_Annotation'
    const newParamValue = annotationParams[AnalyticsQueryParams.Annotation];
    const legacyParamValue = annotationParams[AnalyticsQueryParams.FilterAnnotation];
    return parseAnnotations(newParamValue) ?? parseAnnotations(legacyParamValue);
  }, [annotationParams]);

  // Create setters
  const setRangeType = useCallback(
    (newRangeType: RAQIV2DateRangeType | null) => {
      // Switching to a preset invalidates any prior Custom min/max
      // timestamps; clear them so the URL doesn't carry stale state that
      // confuses downstream consumers (e.g. deep links, Explore Mode handoff).
      const clearCustomBounds =
        newRangeType !== null && newRangeType !== RAQIV2DateRangeType.Custom;
      setDateRangeParams({
        [AnalyticsQueryParams.RangeType]: newRangeType,
        ...(clearCustomBounds && {
          [AnalyticsQueryParams.MinTime]: null,
          [AnalyticsQueryParams.MaxTime]: null,
        }),
      });
    },
    [setDateRangeParams],
  );

  const setDateRange = useCallback(
    (newMinTime: number | null, newMaxTime: number | null) => {
      setDateRangeParams({
        [AnalyticsQueryParams.MinTime]: newMinTime,
        [AnalyticsQueryParams.MaxTime]: newMaxTime,
      });
    },
    [setDateRangeParams],
  );

  const setDateRangeParamsCallback = useCallback(
    (newMinTime: number | null, newMaxTime: number | null, newRangeType: RAQIV2DateRangeType) => {
      setDateRangeParams({
        [AnalyticsQueryParams.MinTime]: newMinTime,
        [AnalyticsQueryParams.MaxTime]: newMaxTime,
        [AnalyticsQueryParams.RangeType]: newRangeType,
      });
    },
    [setDateRangeParams],
  );

  const setSingleDate = useCallback(
    (newSingleDateType: string | null, newSingleDateTime: number | null) => {
      setSingleDateParams({
        [AnalyticsQueryParams.SingleDateType]: newSingleDateType,
        [AnalyticsQueryParams.SingleDateTime]: newSingleDateTime,
      });
    },
    [setSingleDateParams],
  );

  const setBreakdownCallback = useCallback(
    (newBreakdown: TRAQIV2Dimension[]) => {
      // An empty array would be stripped from the URL by the router, which
      // would be indistinguishable from "no breakdown param at all" and
      // cause page-config defaults to be re-applied. Write an explicit
      // sentinel instead so the user's "None" selection persists.
      const value = newBreakdown.length === 0 ? BREAKDOWN_NONE_SENTINEL : newBreakdown;
      setBreakdownParams({ [AnalyticsQueryParams.Breakdown]: value });
    },
    [setBreakdownParams],
  );

  const setGranularityCallback = useCallback(
    (newGranularity: TUIGranularity | null) => {
      const queryValue = newGranularity ? uiGranularityToQueryGranularity[newGranularity] : null;
      setGranularityParams({ [AnalyticsQueryParams.Granularity]: queryValue });
    },
    [setGranularityParams],
  );

  const setFiltersCallback: RawAnalyticsQueryParamsBundle['setFilters'] = useCallback(
    (newFilters, knownDimensions) => {
      const newQueryParams = mergeUIFiltersIntoQueryParams(
        newFilters,
        filterParams,
        knownDimensions,
      );
      setFilterParams(newQueryParams);
    },
    [filterParams, setFilterParams],
  );

  const clearFilterDimensions = useCallback(
    (dimensions: Parameters<RawAnalyticsQueryParamsBundle['clearFilterDimensions']>[0]) => {
      const queryParams: Record<string, null> = {};
      dimensions.forEach((dim) => {
        queryParams[getQueryForDimension(dim)] = null;
      });
      if (Object.keys(queryParams).length > 0) {
        setFilterParams(queryParams);
      }
    },
    [setFilterParams],
  );

  const setAnnotationsCallback = useCallback(
    (newAnnotations: Array<AnnotationType | 'None'>) => {
      setAnnotationParams({ [AnalyticsQueryParams.Annotation]: newAnnotations });
    },
    [setAnnotationParams],
  );

  const bundle = useMemo<RawAnalyticsQueryParamsBundle>(
    () => ({
      // Parsed values
      rangeType,
      minTime,
      maxTime,
      singleDateType,
      singleDateTime,
      breakdown,
      granularity,
      filters,
      annotations,
      // Setters
      setRangeType,
      setDateRange,
      setDateRangeParams: setDateRangeParamsCallback,
      setSingleDate,
      setBreakdown: setBreakdownCallback,
      setGranularity: setGranularityCallback,
      setFilters: setFiltersCallback,
      clearFilterDimensions,
      setAnnotations: setAnnotationsCallback,
    }),
    [
      rangeType,
      minTime,
      maxTime,
      singleDateType,
      singleDateTime,
      breakdown,
      granularity,
      filters,
      annotations,
      setRangeType,
      setDateRange,
      setDateRangeParamsCallback,
      setSingleDate,
      setBreakdownCallback,
      setGranularityCallback,
      setFiltersCallback,
      clearFilterDimensions,
      setAnnotationsCallback,
    ],
  );

  return (
    <RawAnalyticsQueryParamsContext.Provider value={bundle}>
      {children}
    </RawAnalyticsQueryParamsContext.Provider>
  );
};

/**
 * Hook to access raw analytics query params.
 * Returns values that may be undefined (unset) - consumers should apply their own defaults.
 */
export const useRawAnalyticsQueryParams = (): RawAnalyticsQueryParamsBundle => {
  const context = useContext(RawAnalyticsQueryParamsContext);
  if (context === null) {
    throw new Error(
      'useRawAnalyticsQueryParams must be used within a RawAnalyticsQueryParamsProvider',
    );
  }
  return context;
};

export default RawAnalyticsQueryParamsProvider;
