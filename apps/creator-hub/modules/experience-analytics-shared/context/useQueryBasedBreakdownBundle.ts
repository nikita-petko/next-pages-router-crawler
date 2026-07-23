import {
  TRAQIV2BreakdownDimension,
  isSupportedBreakdownDimension,
} from '@modules/clients/analytics';
import { RAQIV2Dimension, RAQIV2UIPseudoDimension } from '@rbx/creator-hub-analytics-config';
import { AnalyticsQueryParams } from '@modules/charts-generic';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import useQueryBasedAnalyticsBundle, { TQueryParamResult } from './useQueryBasedAnalyticsBundle';

export type ExperienceAnalyticsBreakdownBundle = {
  breakdown: TRAQIV2BreakdownDimension[];
  setBreakdown: (breakdown: TRAQIV2BreakdownDimension[]) => void;
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

const legacyBreakdownToRAQIV2 = (
  legacyBreakdown: LegacyBreakdownQueryParam,
): TRAQIV2BreakdownDimension[] => {
  switch (legacyBreakdown) {
    case LegacyBreakdownQueryParam.DeviceType:
      return [RAQIV2Dimension.Platform];
    case LegacyBreakdownQueryParam.AgeGroup:
      return [RAQIV2Dimension.AgeGroup];
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
      throw new Error(`Unhandled legacy breakdown: ${exhaustiveCheck}`);
    }
  }
};

const useQueryBasedBreakdownBundle = (
  log: (
    oldBreakdown: TRAQIV2BreakdownDimension[],
    newBreakdown: TRAQIV2BreakdownDimension[],
  ) => void,
): ExperienceAnalyticsBreakdownBundle => {
  const { value: breakdown, setValue: setBreakdown } = useQueryBasedAnalyticsBundle({
    current: {
      key: AnalyticsQueryParams.Breakdown,
      parse: (value: TQueryParamResult) => {
        if (!value) {
          return [];
        }
        if (Array.isArray(value)) {
          return value.filter((dimension): dimension is TRAQIV2BreakdownDimension =>
            isSupportedBreakdownDimension(dimension),
          );
        }
        if (isSupportedBreakdownDimension(value)) {
          return [value];
        }
        return [];
      },
      serialize: (value: TRAQIV2BreakdownDimension[]) => value,
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
      shouldUpgrade: (current: TRAQIV2BreakdownDimension[], legacy: TRAQIV2BreakdownDimension[]) =>
        current.length === 0 && legacy.length > 0,
    },
    log,
  });
  return { breakdown, setBreakdown };
};
export default useQueryBasedBreakdownBundle;
