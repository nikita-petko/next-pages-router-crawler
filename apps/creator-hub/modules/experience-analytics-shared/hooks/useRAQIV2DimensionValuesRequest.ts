import { useCallback, useMemo } from 'react';
import {
  RAQIV2Dimension,
  RAQIV2DimensionDisplayConfig,
  RAQIV2DimensionValueType,
} from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2APIMetric, TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import type {
  RAQIV2ChartResource,
  RAQIV2BreakdownValue,
  RAQIV2APIQueryFilter,
} from '@modules/clients/analytics';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { useCachedAnalyticsQueryGateway } from '../context/AnalyticsQueryGatewayProvider';
import type TDateRangeSelection from '../types/DateRangeSelection';
import { isLoadingRAQIV2Prerequisites } from '../utils/RAQIV2InternalException';
import resolveDateRangeSelection from '../utils/resolveDateRangeSelection';
import type { TUseApiRequestResponse } from './useApiRequest';
import useApiRequest from './useApiRequest';

export type RAQIV2CombinedDimensionValuesResult = null | {
  values: Array<RAQIV2BreakdownValue>;
};

const useRAQIV2DimensionValuesRequest = (
  resource: RAQIV2ChartResource,
  dimension: TRAQIV2Dimension,
  contextMetrics: Array<TRAQIV2APIMetric>,
  dateRangeSelection?: TDateRangeSelection,
  // Optional scoping filters forwarded to the gateway. Used so dependent
  // dimensions (e.g. PlaceVersion, whose YAML declares `required_dimensions:
  // [Place]`) can be narrowed by the values currently picked in sibling
  // filter dropdowns.
  filter?: readonly RAQIV2APIQueryFilter[],
): TUseApiRequestResponse<RAQIV2CombinedDimensionValuesResult> => {
  const {
    client: { getDimensionValues: platformGetDimension },
  } = useCachedAnalyticsQueryGateway();

  const { valueType: dimensionValueType } = RAQIV2DimensionDisplayConfig[dimension];

  const { startDate: bundleStartTime, endDate: bundleEndTime } =
    useAnalyticsCurrentDateRangeBundle();

  const { startTime, endTime } = useMemo(() => {
    if (dateRangeSelection) {
      return resolveDateRangeSelection(dateRangeSelection);
    }
    return { startTime: bundleStartTime, endTime: bundleEndTime };
  }, [dateRangeSelection, bundleStartTime, bundleEndTime]);

  // Strip filters that target the dimension we're loading values for —
  // we want the full set of available values, not just ones already
  // selected — and drop empty-value entries so we don't no-op filter on
  // the backend.
  const scopingFilters = useMemo<readonly RAQIV2APIQueryFilter[] | undefined>(() => {
    if (!filter || filter.length === 0) {
      return undefined;
    }
    const cleaned = filter.filter(
      (f) => f.dimension !== dimension && f.values && f.values.length > 0,
    );
    return cleaned.length > 0 ? cleaned : undefined;
  }, [filter, dimension]);

  const makeRequest = useCallback(async (): Promise<RAQIV2CombinedDimensionValuesResult> => {
    switch (dimensionValueType) {
      case RAQIV2DimensionValueType.Dynamic:
      case RAQIV2DimensionValueType.DynamicWithPreset:
        break;
      case RAQIV2DimensionValueType.Enum:
        return null;
      default: {
        const exhaustiveCheck: never = dimensionValueType;
        throw new Error(
          `Unknown dimension value type ${String(exhaustiveCheck)} for dimension ${dimension}`,
        );
      }
    }
    if (
      isLoadingRAQIV2Prerequisites(resource) ||
      !isValidEnumValue(RAQIV2Dimension, dimension) ||
      // No metric context available yet — `platformGetDimension` requires at
      // least one metric to scope the option lookup, so a request now would
      // either error server-side or return unscoped data. Callers that depend
      // on this hook (e.g. the dynamic page filter) treat the empty-context
      // window as "still resolving" and surface their own loading state until
      // a real metric arrives and triggers a re-run with non-empty `metrics`.
      contextMetrics.length === 0
    ) {
      return null;
    }
    const { values: responseValues } = await platformGetDimension({
      resource,
      metrics: contextMetrics,
      dimension,
      startTime,
      endTime,
      filter: scopingFilters ? [...scopingFilters] : undefined,
    });
    if (!responseValues) {
      return null;
    }
    const matchingEntries = responseValues.filter(({ dimension: dim }) => dim?.name === dimension);
    if (matchingEntries.length === 0) {
      return null;
    }

    const seen = new Set<string>();
    const mergedValues: Array<RAQIV2BreakdownValue> = [];
    matchingEntries
      .flatMap((entry) => entry.values ?? [])
      .forEach((breakdownValue) => {
        const key = breakdownValue.value;
        if (key === undefined || key === '') {
          return;
        }
        if (!seen.has(key)) {
          seen.add(key);
          mergedValues.push(breakdownValue);
        }
      });
    return { values: mergedValues };
  }, [
    resource,
    platformGetDimension,
    contextMetrics,
    dimension,
    startTime,
    endTime,
    dimensionValueType,
    scopingFilters,
  ]);

  return useApiRequest(makeRequest);
};

export default useRAQIV2DimensionValuesRequest;
