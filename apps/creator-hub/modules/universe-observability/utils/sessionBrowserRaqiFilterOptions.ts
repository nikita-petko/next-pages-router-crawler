import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import {
  UniverseSessionOperatingSystem,
  UniverseSessionPlatform,
} from '@modules/clients/analytics/universeSessionMetadataApi';
import {
  getRAQIFilterConfig,
  OptionType,
} from '@modules/experience-analytics-shared/constants/FilterDimensionConfig';
import type { EnumType } from '@modules/miscellaneous/utils/enumUtils';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';

export type SessionBrowserRaqiEnumDimension =
  | typeof RAQIV2Dimension.Platform
  | typeof RAQIV2Dimension.OperatingSystem;

export const getSessionBrowserRaqiEnumOptions = <TEnum extends string>(
  dimension: SessionBrowserRaqiEnumDimension,
  allowedEnum: EnumType<TEnum>,
): { readonly options: TEnum[]; readonly multiple: boolean } => {
  const config = getRAQIFilterConfig(dimension);
  if (config.optionType !== OptionType.RAQIV2StaticEnum) {
    return { options: [], multiple: true };
  }

  const orderedOptions = config.optionOrder.filter((option): option is TEnum =>
    isValidEnumValue(allowedEnum, option),
  );
  const remainingOptions = config.enumOptions.filter(
    (option): option is TEnum =>
      isValidEnumValue(allowedEnum, option) && !orderedOptions.includes(option),
  );
  return {
    options: [...orderedOptions, ...remainingOptions],
    multiple: config.multiple,
  };
};

export const getSessionBrowserPlatformFilterOptions = (): ReturnType<
  typeof getSessionBrowserRaqiEnumOptions<UniverseSessionPlatform>
> => getSessionBrowserRaqiEnumOptions(RAQIV2Dimension.Platform, UniverseSessionPlatform);

export const getSessionBrowserOperatingSystemFilterOptions = (): ReturnType<
  typeof getSessionBrowserRaqiEnumOptions<UniverseSessionOperatingSystem>
> =>
  getSessionBrowserRaqiEnumOptions(RAQIV2Dimension.OperatingSystem, UniverseSessionOperatingSystem);
