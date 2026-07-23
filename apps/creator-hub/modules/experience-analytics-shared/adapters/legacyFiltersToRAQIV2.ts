import {
  RAQIV2AggregationType,
  RAQIV2Dimension,
  RAQIV2DimensionDisplayConfig,
  RAQIV2DimensionValueType,
  RAQIV2PercentileType,
  RAQIV2UIPseudoDimension,
  RAQIV2FilterOperation,
} from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { RAQIV2QueryFilter } from '@modules/clients/analytics';
import type { EnumType } from '@modules/miscellaneous/utils/enumUtils';
import { isValidEnumValue, isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { raqiSupportedFilterBarDimensions } from '../constants/FilterDimensionConfig';
import type { UIFilters } from '../layout/ExperienceAnalyticsPageControlBar/filterUtils';

const getAsEnumValue = <TEnum extends string | number>(
  obj: EnumType<TEnum>,
  input: string | number,
): TEnum | null => {
  if (isValidEnumValue(obj, input)) {
    return input;
  }
  return null;
};

type SingleUIFilter = UIFilters[0];

const enumConverter = <TEnum extends string>(
  dimension: TRAQIV2Dimension,
  dimensionOptions: EnumType<TEnum>,
) => {
  if (!isValidArrayEnumValue(raqiSupportedFilterBarDimensions, dimension)) {
    return null;
  }
  return (filter: SingleUIFilter): RAQIV2QueryFilter => {
    const { values } = filter;
    const v2Values: TEnum[] = [];
    values.forEach((untyped) => {
      const typed = getAsEnumValue(dimensionOptions, untyped);
      if (typed) {
        v2Values.push(typed);
      }
    });

    // Pseudo-dimensions need extra value validation; all other dimensions
    // pass through. An if/else chain is used instead of a switch to avoid
    // `switch-exhaustiveness-check` over the entire TRAQIV2Dimension enum.
    if (dimension === RAQIV2UIPseudoDimension.AggregationType) {
      return {
        dimension,
        values: v2Values.filter((dim) => isValidEnumValue(RAQIV2AggregationType, dim)),
      };
    }
    if (dimension === RAQIV2UIPseudoDimension.PercentileType) {
      return {
        dimension,
        values: v2Values.filter((dim) => isValidEnumValue(RAQIV2PercentileType, dim)),
      };
    }
    return { dimension, values: v2Values };
  };
};

const rawStringConverter = (dimension: TRAQIV2Dimension) => {
  if (!isValidArrayEnumValue(raqiSupportedFilterBarDimensions, dimension)) {
    return null;
  }
  return (filter: SingleUIFilter): RAQIV2QueryFilter => {
    if (dimension === RAQIV2UIPseudoDimension.AggregationType) {
      return {
        dimension,
        values: filter.values.filter((dim) => isValidEnumValue(RAQIV2AggregationType, dim)),
      };
    }
    if (dimension === RAQIV2UIPseudoDimension.PercentileType) {
      return {
        dimension,
        values: filter.values.filter((dim) => isValidEnumValue(RAQIV2PercentileType, dim)),
      };
    }
    return { dimension, values: filter.values };
  };
};

const getConvertFunction = (dimension: TRAQIV2Dimension) => {
  const dimensionConfig = RAQIV2DimensionDisplayConfig[dimension];
  const { valueType } = dimensionConfig;
  switch (valueType) {
    case RAQIV2DimensionValueType.Enum:
      return enumConverter(dimension, dimensionConfig.dimensionValues);
    case RAQIV2DimensionValueType.Dynamic:
    case RAQIV2DimensionValueType.DynamicWithPreset:
      return rawStringConverter(dimension);
    default: {
      const exhaustiveCheck: never = valueType;
      throw new Error(`Unhandled dimension value type ${String(exhaustiveCheck)}`);
    }
  }
};

const legacyFiltersToRAQIV2 = (uiFilters: UIFilters): RAQIV2QueryFilter[] => {
  const result: RAQIV2QueryFilter[] = [];
  uiFilters.forEach(({ dimension, values }) => {
    if (dimension === RAQIV2Dimension.Keyword) {
      const keyword = values[0]?.trim();
      if (keyword) {
        result.push({
          dimension: RAQIV2Dimension.Keyword,
          values: [keyword],
          operation: RAQIV2FilterOperation.Match,
        });
      }
      return;
    }

    // first seen place version is a special case, we need to convert it to a gte filter
    if (dimension === RAQIV2Dimension.FirstSeenPlaceVersion) {
      const placeVersion = values[0]?.trim();
      if (placeVersion) {
        result.push({
          dimension: RAQIV2Dimension.FirstSeenPlaceVersion,
          values: [placeVersion],
          operation: RAQIV2FilterOperation.Gte,
        });
      }
      return;
    }

    if (!isValidArrayEnumValue(raqiSupportedFilterBarDimensions, dimension)) {
      return;
    }

    const convertFunction = getConvertFunction(dimension);
    if (convertFunction) {
      const converted: RAQIV2QueryFilter | null = convertFunction({ dimension, values });
      if (converted) {
        result.push(converted);
      }
    }
  });
  return result;
};
export default legacyFiltersToRAQIV2;

export const raqiV2FiltersToLegacy = (raqiV2Filters: readonly RAQIV2QueryFilter[]): UIFilters => {
  const result: UIFilters = [];
  raqiV2Filters.forEach(({ dimension, values }) => {
    result.push({ dimension, values });
  });
  return result;
};
