import { RAQIV2Dimension, RAQIV2UIPseudoDimension } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { TQueryParamResult } from './useQueryBasedAnalyticsBundle';
import useQueryBasedAnalyticsBundle from './useQueryBasedAnalyticsBundle';

export type ExperienceAnalyticsBreakdownBundle = {
  breakdown: TRAQIV2Dimension[];
  setBreakdown: (breakdown: TRAQIV2Dimension[]) => void;
};

export enum LegacyBreakdownQueryParam {
  Total = 'Total',
  AgeGroup = 'AgeGroup',
  DeviceType = 'DeviceType',
  OperatingSystem = 'OperatingSystem',
  Country = 'Country',
  Locale = 'Locale',
  ProductType = 'ProductType',
}

const isSupportedDimension = (value: string): value is TRAQIV2Dimension =>
  isValidEnumValue(RAQIV2Dimension, value) || isValidEnumValue(RAQIV2UIPseudoDimension, value);

const legacyBreakdownToRAQIV2 = (
  legacyBreakdown: LegacyBreakdownQueryParam,
): TRAQIV2Dimension[] => {
  switch (legacyBreakdown) {
    case LegacyBreakdownQueryParam.DeviceType:
      return [RAQIV2Dimension.Platform];
    case LegacyBreakdownQueryParam.AgeGroup:
      return [RAQIV2Dimension.AgeGroupV2];
    case LegacyBreakdownQueryParam.OperatingSystem:
      return [RAQIV2Dimension.OperatingSystem];
    case LegacyBreakdownQueryParam.Country:
      return [RAQIV2UIPseudoDimension.TopCountries];
    case LegacyBreakdownQueryParam.Locale:
      return [RAQIV2UIPseudoDimension.TopLocales];
    case LegacyBreakdownQueryParam.Total:
    case LegacyBreakdownQueryParam.ProductType:
      return [];
    default: {
      const exhaustiveCheck: never = legacyBreakdown;
      throw new Error(`Unhandled legacy breakdown: ${String(exhaustiveCheck)}`);
    }
  }
};

const useQueryBasedBreakdownBundle = (
  log: (oldBreakdown: TRAQIV2Dimension[], newBreakdown: TRAQIV2Dimension[]) => void,
): ExperienceAnalyticsBreakdownBundle => {
  const { value: breakdown, setValue: setBreakdown } = useQueryBasedAnalyticsBundle({
    current: {
      key: AnalyticsQueryParams.Breakdown,
      parse: (value: TQueryParamResult) => {
        if (!value) {
          return [];
        }
        if (Array.isArray(value)) {
          return value.filter((dimension): dimension is TRAQIV2Dimension =>
            isSupportedDimension(dimension),
          );
        }
        if (isSupportedDimension(value)) {
          return [value];
        }
        return [];
      },
      serialize: (value: TRAQIV2Dimension[]) => value,
    },
    legacy: {
      key: AnalyticsQueryParams.LegacyBreakdownType,
      parseAndMigrate: (value: TQueryParamResult) => {
        if (!value) {
          return null;
        }
        const legacyBreakdownQueryParam = Array.isArray(value) ? value[0] : value;
        if (isValidEnumValue(LegacyBreakdownQueryParam, legacyBreakdownQueryParam)) {
          return legacyBreakdownToRAQIV2(legacyBreakdownQueryParam);
        }
        return null;
      },
      shouldUpgrade: (current: TRAQIV2Dimension[], legacy: TRAQIV2Dimension[]) =>
        current.length === 0 && legacy.length > 0,
    },
    log,
  });
  return { breakdown, setBreakdown };
};
export default useQueryBasedBreakdownBundle;
