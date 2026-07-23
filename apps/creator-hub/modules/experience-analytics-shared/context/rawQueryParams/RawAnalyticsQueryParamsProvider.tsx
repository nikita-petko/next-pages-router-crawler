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

import React, { createContext, useContext, useMemo, useCallback, FC } from 'react';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { AnalyticsQueryParams, DateRangeType } from '@modules/charts-generic';
import { TRAQIV2BreakdownDimension, AnnotationType } from '@modules/clients/analytics';
import { RawAnalyticsQueryParamsBundle } from './types';
import { TUIGranularity } from '../../utils/seriesGranularities';
import {
  filterBarDimensionToQueryKey,
  queryParamsToUIFilters,
  mergeUIFiltersIntoQueryParams,
  getQueryForDimension,
} from '../../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import { uiGranularityToQueryGranularity } from '../AnalyticsCurrentGranularityProvider';
import {
  parseRangeType,
  parseTimestamp,
  parseBreakdown,
  parseGranularity,
  parseSingleDateType,
  parseAnnotations,
} from './queryParamParsers';

const emptyFilters: RawAnalyticsQueryParamsBundle['filters'] = [];

const defaultBundle: RawAnalyticsQueryParamsBundle = {
  // Date range - all unset
  rangeType: undefined,
  minTime: undefined,
  maxTime: undefined,
  // Single date - all unset
  singleDateType: undefined,
  singleDateTime: undefined,
  // Breakdown - unset
  breakdown: undefined,
  // Granularity - unset
  granularity: undefined,
  // Filters - empty
  filters: emptyFilters,
  // Annotations - unset
  annotations: undefined,
  // Setters - no-ops
  setRangeType: () => {},
  setDateRange: () => {},
  setDateRangeParams: () => {},
  setSingleDate: () => {},
  setBreakdown: () => {},
  setGranularity: () => {},
  setFilters: () => {},
  clearFilterDimension: () => {},
  setAnnotations: () => {},
};

export const RawAnalyticsQueryParamsContext =
  createContext<RawAnalyticsQueryParamsBundle>(defaultBundle);
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

const filterQueryParamKeys = Object.values(filterBarDimensionToQueryKey);

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
    (newRangeType: DateRangeType | null) => {
      setDateRangeParams({ [AnalyticsQueryParams.RangeType]: newRangeType });
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
    (newMinTime: number | null, newMaxTime: number | null, newRangeType: DateRangeType) => {
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
    (newBreakdown: TRAQIV2BreakdownDimension[]) => {
      setBreakdownParams({ [AnalyticsQueryParams.Breakdown]: newBreakdown });
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

  const clearFilterDimension = useCallback(
    (dimension: Parameters<RawAnalyticsQueryParamsBundle['clearFilterDimension']>[0]) => {
      setFilterParams({ [getQueryForDimension(dimension)]: null });
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
      clearFilterDimension,
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
      clearFilterDimension,
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
  return useContext(RawAnalyticsQueryParamsContext);
};

export default RawAnalyticsQueryParamsProvider;
