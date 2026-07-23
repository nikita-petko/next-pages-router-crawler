import { RAQIV2QueryFilter } from '@modules/clients/analytics';

import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { EnumType, isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import {
  RAQIV2DimensionDisplayConfig,
  RAQIV2DimensionValueType,
  RAQIV2AggregationType,
  RAQIV2PercentileType,
  RAQIV2UIPseudoDimension,
  TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import { UIFilters } from '../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import { raqiSupportedFilterBarDimensions } from '../constants/FilterDimensionConfig';

const getAsEnumValue = <TEnum extends string | number>(
  obj: EnumType<TEnum>,
  input: string | number,
): TEnum | null => {
  if (isValidEnumValue(obj, input)) {
    return input as TEnum;
  }
  return null;
};

type SingleUIFilter = UIFilters[0];

const enumConverter = <TEnum extends string>(
  dimension: TRAQIV2Dimension,
  dimensionOptions: EnumType<TEnum>,
) => {
  if (!isValidArrayEnumValue(raqiSupportedFilterBarDimensions, dimension)) return null;
  return (filter: SingleUIFilter): RAQIV2QueryFilter => {
    const { values } = filter;
    const v2Values: TEnum[] = [];
    values.forEach((untyped) => {
      const typed = getAsEnumValue(dimensionOptions, untyped);
      if (typed) {
        v2Values.push(typed);
      }
    });

    switch (dimension) {
      case RAQIV2UIPseudoDimension.AggregationType:
        return {
          dimension,
          values: v2Values.filter((dim) => isValidEnumValue(RAQIV2AggregationType, dim)),
        };
      case RAQIV2UIPseudoDimension.PercentileType:
        return {
          dimension,
          values: v2Values.filter((dim) => isValidEnumValue(RAQIV2PercentileType, dim)),
        };
      default:
        return { dimension, values: v2Values };
    }
  };
};

const rawStringConverter = (dimension: TRAQIV2Dimension) => {
  if (!isValidArrayEnumValue(raqiSupportedFilterBarDimensions, dimension)) return null;
  return (filter: SingleUIFilter): RAQIV2QueryFilter => {
    switch (dimension) {
      case RAQIV2UIPseudoDimension.AggregationType:
        return {
          dimension,
          values: filter.values.filter((dim) => isValidEnumValue(RAQIV2AggregationType, dim)),
        };
      case RAQIV2UIPseudoDimension.PercentileType:
        return {
          dimension,
          values: filter.values.filter((dim) => isValidEnumValue(RAQIV2PercentileType, dim)),
        };
      default:
        return { dimension, values: filter.values };
    }
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
      throw new Error(`Unhandled dimension value type ${exhaustiveCheck}`);
    }
  }
};

const legacyFiltersToRAQIV2 = (uiFilters: UIFilters): RAQIV2QueryFilter[] => {
  const result: RAQIV2QueryFilter[] = [];
  uiFilters.forEach(({ dimension, values }) => {
    if (!isValidArrayEnumValue(raqiSupportedFilterBarDimensions, dimension)) return;

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
