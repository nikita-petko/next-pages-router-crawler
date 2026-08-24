import {
  UniverseSessionOperatingSystem,
  UniverseSessionPlatform,
} from '@modules/clients/analytics/universeSessionMetadataApi';

// An em dash is punctuation rather than prose, so it stays out of the translation layer.
// GenericTableV2 renders this same literal for its own unparseable timestamps, which keeps
// the text columns here consistent with the timestamp column beside them.
export const MISSING_VALUE_PLACEHOLDER = '\u2014';

export const formatMissingValue = <TValue>(
  value: TValue | null | undefined,
  missingPlaceholder: string,
  format: (value: TValue) => string = String,
): string => (value == null ? missingPlaceholder : format(value));

// TODO(@yukihe): map these enums onto the RAQIV2 device/OS dimension and render them through its
// dimension renderer, so Client Sessions matches the wording used across the rest of analytics
// instead of echoing the raw enum member.
export const formatOperatingSystem = (
  operatingSystem: UniverseSessionOperatingSystem,
  missingPlaceholder: string = MISSING_VALUE_PLACEHOLDER,
): string => {
  if (
    operatingSystem === UniverseSessionOperatingSystem.Invalid ||
    operatingSystem === UniverseSessionOperatingSystem.Unknown
  ) {
    return missingPlaceholder;
  }

  return operatingSystem;
};

export const formatPlatform = (
  platform: UniverseSessionPlatform,
  missingPlaceholder: string = MISSING_VALUE_PLACEHOLDER,
): string => (platform === UniverseSessionPlatform.Invalid ? missingPlaceholder : platform);
