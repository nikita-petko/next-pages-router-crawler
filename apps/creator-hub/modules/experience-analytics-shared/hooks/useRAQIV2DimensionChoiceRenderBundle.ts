import { useMemo, useCallback } from 'react';
import {
  RAQIV2BreakdownValueOrder,
  RAQIV2DimensionDisplayConfig,
  RAQIV2DimensionValueType,
} from '@rbx/creator-hub-analytics-config';
import type {
  TDimensionSortConfig,
  TRAQIV2APIMetric,
  TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import type { FormattedText } from '@modules/analytics-translations/types';
import type {
  RAQIV2APIQueryFilter,
  RAQIV2BreakdownValue,
  RAQIV2ChartResource,
} from '@modules/clients/analytics';
import { getSingleDimensionBreakdownLabel } from '../adapters/genericRAQIV2ChartAdapter';
import { makePartialOrderSortFunction } from '../adapters/sortRAQIV2SeriesByBreakdowns';
import type TDateRangeSelection from '../types/DateRangeSelection';
import useRAQIV2DimensionValuesRequest from './useRAQIV2DimensionValuesRequest';
import useRAQIV2TranslationDependencies from './useRAQIV2TranslationDependencies';

const sortByBreakdownOrdering = <T extends string>(
  values: T[],
  breakdownOrdering: RAQIV2BreakdownValueOrder | TDimensionSortConfig<string>,
): T[] => {
  const completeOrPartialOrder =
    typeof breakdownOrdering === 'string'
      ? []
      : (breakdownOrdering?.completeOrder ?? breakdownOrdering?.partialOrder ?? []);
  const fallbackSort =
    typeof breakdownOrdering === 'string'
      ? breakdownOrdering
      : (breakdownOrdering?.remainingSort ?? RAQIV2BreakdownValueOrder.Unsorted);
  const sortFunction = makePartialOrderSortFunction({
    ordering: completeOrPartialOrder,
    remainingSort: fallbackSort,
  });
  const toSort = [...values];
  toSort.sort((a, b) => sortFunction({ value: a }, { value: b }));
  return toSort;
};

const getEnumOptions = <T extends string, TDimension extends TRAQIV2Dimension>(
  config: (typeof RAQIV2DimensionDisplayConfig)[TDimension],
): T[] => {
  const { valueType: dimensionValueType, breakdownOrdering } = config;

  // Need to guard against Dynamic dimension value type to enable typescript unpacking
  switch (dimensionValueType) {
    case RAQIV2DimensionValueType.Dynamic:
      throw new Error('Dynamic dimension value type does not have enum options');
    case RAQIV2DimensionValueType.DynamicWithPreset:
    case RAQIV2DimensionValueType.Enum:
      break;
    default: {
      const exhaustiveCheck: never = dimensionValueType;
      throw new Error(`Unknown dimension value type ${String(exhaustiveCheck)}.`);
    }
  }

  const { dimensionValues } = config;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- RAQI enum configs are keyed by this dimension's value type.
  const supportedValues = Object.values(dimensionValues) as T[];

  // If ordering is specified, that will be used for the order of the options
  return sortByBreakdownOrdering(supportedValues, breakdownOrdering);
};

const filterUnsupportedValues = <T extends string, TDimension extends TRAQIV2Dimension>(
  config: (typeof RAQIV2DimensionDisplayConfig)[TDimension],
  values: T[],
): T[] => {
  const { valueType: dimensionValueType } = config;
  switch (dimensionValueType) {
    case RAQIV2DimensionValueType.Dynamic:
      return values;
    case RAQIV2DimensionValueType.DynamicWithPreset:
    case RAQIV2DimensionValueType.Enum: {
      const { filterSupported } = config;
      const filterSupportByValue = new Map<string, boolean>();
      Object.entries(filterSupported ?? {}).forEach(([value, supported]) => {
        if (typeof supported === 'boolean') {
          filterSupportByValue.set(value, supported);
        }
      });
      return values.filter((value) => filterSupportByValue.get(value) !== false);
    }
    default: {
      const exhaustiveCheck: never = dimensionValueType;
      throw new Error(`Unknown dimension value type ${String(exhaustiveCheck)}.`);
    }
  }
};

const getVisibleOptions = <T extends string, TDimension extends TRAQIV2Dimension>(
  config: (typeof RAQIV2DimensionDisplayConfig)[TDimension],
  dataValues: RAQIV2BreakdownValue[] | undefined,
  { onlyFilterSupportedValues = false }: { onlyFilterSupportedValues?: boolean } = {},
): T[] => {
  const { valueType: dimensionValueType, breakdownOrdering } = config;
  const applyFilterSupport = (values: T[]): T[] =>
    onlyFilterSupportedValues ? filterUnsupportedValues(config, values) : values;

  switch (dimensionValueType) {
    case RAQIV2DimensionValueType.DynamicWithPreset:
    case RAQIV2DimensionValueType.Dynamic: {
      const result: T[] = [];
      const seen = new Set<T>();
      if (dimensionValueType === RAQIV2DimensionValueType.DynamicWithPreset) {
        const enumOptions = getEnumOptions<T, TDimension>(config);
        enumOptions.forEach((preset) => {
          result.push(preset);
          seen.add(preset);
        });
      }

      // Collect dynamic values that aren't presets
      const dynamicValues: T[] = [];
      dataValues?.forEach((value: RAQIV2BreakdownValue) => {
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- gateway values are already scoped to this RAQI dimension.
        const option: T | undefined = value.value as T | undefined;
        if (option && !seen.has(option)) {
          dynamicValues.push(option);
          seen.add(option);
        }
      });
      // Sort dynamic values if SortByValueAlphabetically is configured
      const toSort = sortByBreakdownOrdering(dynamicValues, breakdownOrdering);
      result.push(...toSort);

      return applyFilterSupport(result);
    }
    case RAQIV2DimensionValueType.Enum: {
      return applyFilterSupport(getEnumOptions(config));
    }
    default: {
      const exhaustiveCheck: never = dimensionValueType;
      throw new Error(`What options for dimension value type ${String(exhaustiveCheck)}?`);
    }
  }
};

/**
 * TODO(gperkins@20240725): DSA-2963 -- we would like use TDimensionToBreakdownValues, e.g...
 *
 * const useRAQIV2DimensionChoiceRenderBundle = <T extends RAQIV2Dimension>(
 *   raqiDimension: T,
 *   contextMetrics: TRAQIV2APIMetric[],
 * ): {
 *   enumOptions: TDimensionToBreakdownValues<T>[];
 *   isDataLoading: boolean;
 *   formatOption: (option: TDimensionToBreakdownValues<T>) => FormattedText;
 * } => {
 *
 * But this causes downstream errors in ExperienceAnalyticsPageFilterChoiceDynamicRAQIV2.
 *
 * NOTE(gperkins@20250319): I am not sure that would be valuable enough to be worth it.
 */

const useRAQIV2DimensionChoiceRenderBundle = <T extends string>(
  resource: RAQIV2ChartResource,
  raqiDimension: TRAQIV2Dimension,
  contextMetrics: TRAQIV2APIMetric[],
  dateRangeSelection?: TDateRangeSelection,
  options?: {
    onlyFilterSupportedValues?: boolean;
    // Optional filters to scope dimension value lookup. Lets dependent
    // dimensions (e.g. PlaceVersion narrowed by the currently selected Place)
    // request only the relevant subset of options.
    filter?: readonly RAQIV2APIQueryFilter[];
  },
): {
  enumOptions: T[];
  isDataLoading: boolean;
  formatOption: (option: T) => FormattedText;
} => {
  // TODO(gperkins@20250319): DSA-4195 We should be able to "Go to definition"
  // into RAQIV2DimensionDisplayConfig in creator-analytics-config source
  const { valueType: dimensionValueType } = RAQIV2DimensionDisplayConfig[raqiDimension];
  const translationDependencies = useRAQIV2TranslationDependencies();
  const onlyFilterSupportedValues = options?.onlyFilterSupportedValues ?? false;
  const filter = options?.filter;

  const { data, isDataLoading } = useRAQIV2DimensionValuesRequest(
    resource,
    raqiDimension,
    contextMetrics,
    dateRangeSelection,
    filter,
  );
  const visibleOptions: T[] = useMemo(
    () =>
      getVisibleOptions<T, typeof raqiDimension>(
        RAQIV2DimensionDisplayConfig[raqiDimension],
        data?.values,
        { onlyFilterSupportedValues },
      ),
    [raqiDimension, data?.values, onlyFilterSupportedValues],
  );

  const formatOption = useCallback(
    // TODO(gperkins@20240725): DSA-2963 -- option: TDimensionToBreakdownValues<T>
    (option: T) => {
      switch (dimensionValueType) {
        case RAQIV2DimensionValueType.DynamicWithPreset:
        case RAQIV2DimensionValueType.Dynamic: {
          const findValue = data?.values?.find((value) => value.value === option);
          if (findValue) {
            /**
             * NOTE(gperkins@20240514): Best case we can use the combined formatter,
             * potentially using the display value.
             */
            return getSingleDimensionBreakdownLabel(findValue, translationDependencies).name;
          }
          /**
           * NOTE(gperkins@20240514): The filter has a value which isn't in the current range.
           *
           * e.g:
           * - if its query parameter was manually edited, or
           * - if the value appears in the data set but outside the current time range
           *  (so it doesn't appear in the dimension values response we made)
           *
           * In these cases we fall back to the dimension renderer's formatter.
           */
          return getSingleDimensionBreakdownLabel(
            { dimension: raqiDimension, value: option },
            translationDependencies,
          ).name;
        }
        case RAQIV2DimensionValueType.Enum: {
          return getSingleDimensionBreakdownLabel(
            { dimension: raqiDimension, value: option },
            translationDependencies,
          ).name;
        }
        default: {
          const exhaustiveCheck: never = dimensionValueType;
          throw new Error(`Unhandled dimension value type formatter ${String(exhaustiveCheck)}`);
        }
      }
    },
    [data?.values, dimensionValueType, raqiDimension, translationDependencies],
  );

  return { enumOptions: visibleOptions, isDataLoading, formatOption };
};

export default useRAQIV2DimensionChoiceRenderBundle;
export { getVisibleOptions };
