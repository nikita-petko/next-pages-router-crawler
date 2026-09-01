import { dateTimeFormatter } from '@rbx/core';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import {
  type FormattedText,
  TranslationKeyOrFormattedTextType,
} from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import {
  formatNumberWithSpec,
  type TFormattingSpec,
} from '@modules/charts-generic/charts/numberFormatters';
import { oneDecimalFormattingSpec } from '@modules/charts-generic/constants/analyticsNumberFormattingSpec';
import type {
  UniversePlaySession,
  UniverseSessionOperatingSystem,
  UniverseSessionPlace,
  UniverseSessionPlatform,
} from '@modules/clients/analytics/universeSessionMetadataApi';
import { getSingleDimensionBreakdownLabel } from '@modules/experience-analytics-shared/adapters/genericRAQIV2ChartAdapter';
import type { RAQIV2TranslationDependencies } from '@modules/experience-analytics-shared/types/RAQIV2DimensionRenderer';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const MEGABYTES_PER_GIGABYTE = 1024;
export const MILLISECONDS_PER_MINUTE = 60_000;

export const CLIENT_SESSION_START_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
};

export const CLIENT_SESSION_DURATION_FORMATTING_SPEC: TFormattingSpec = {
  ...oneDecimalFormattingSpec,
  suffix: {
    type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
    key: translationKey('Label.MinsSuffix', TranslationNamespace.Analytics),
  },
};

export const CLIENT_SESSION_MIN_FPS_FORMATTING_SPEC = oneDecimalFormattingSpec;

export const CLIENT_SESSION_MEMORY_USAGE_FORMATTING_SPEC: TFormattingSpec = {
  ...oneDecimalFormattingSpec,
  suffix: {
    type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
    key: translationKey('Label.MegabytesSuffix', TranslationNamespace.Analytics),
  },
};

const DEVICE_MEMORY_FORMATTING_SPEC: TFormattingSpec = {
  ...oneDecimalFormattingSpec,
  scalingFactor: 1 / MEGABYTES_PER_GIGABYTE,
  suffix: {
    type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
    key: translationKey('Label.GigabytesSuffix', TranslationNamespace.Analytics),
  },
};

// An em dash is punctuation rather than prose, so it stays out of the translation layer.
// GenericTableV2 renders this same literal for its own unparseable timestamps, which keeps
// the text columns here consistent with the timestamp column beside them.
export const MISSING_VALUE_PLACEHOLDER = '\u2014';

export const durationMillisecondsToMinutes = (
  durationMilliseconds: number | null | undefined,
): number | null =>
  durationMilliseconds == null ? null : durationMilliseconds / MILLISECONDS_PER_MINUTE;

const formatNullableNumberWithSpec = (
  value: number | null | undefined,
  formattingSpec: TFormattingSpec,
  translationDependencies: RAQIV2TranslationDependencies,
): FormattedText =>
  formatNumberWithSpec(value ?? Number.NaN, formattingSpec, translationDependencies);

export const formatClientSessionStartTime = (
  startedTime: Date | null,
  translationDependencies: RAQIV2TranslationDependencies,
): string =>
  startedTime == null
    ? MISSING_VALUE_PLACEHOLDER
    : dateTimeFormatter(translationDependencies.locale).getCustomDateTime(startedTime, {
        ...CLIENT_SESSION_START_TIME_FORMAT_OPTIONS,
        timeZoneName: 'short',
      });

export const formatClientSessionDuration = (
  durationMilliseconds: number | null,
  translationDependencies: RAQIV2TranslationDependencies,
): FormattedText =>
  formatNullableNumberWithSpec(
    durationMillisecondsToMinutes(durationMilliseconds),
    CLIENT_SESSION_DURATION_FORMATTING_SPEC,
    translationDependencies,
  );

export const formatClientSessionMinFps = (
  minFps: number | null,
  translationDependencies: RAQIV2TranslationDependencies,
): FormattedText =>
  formatNullableNumberWithSpec(
    minFps,
    CLIENT_SESSION_MIN_FPS_FORMATTING_SPEC,
    translationDependencies,
  );

export const formatClientSessionMemoryUsage = (
  memoryMegabytes: number | null,
  translationDependencies: RAQIV2TranslationDependencies,
): FormattedText =>
  formatNullableNumberWithSpec(
    memoryMegabytes,
    CLIENT_SESSION_MEMORY_USAGE_FORMATTING_SPEC,
    translationDependencies,
  );

export const formatClientSessionDeviceMemory = (
  memoryMegabytes: number | null,
  translationDependencies: RAQIV2TranslationDependencies,
): FormattedText =>
  formatNullableNumberWithSpec(
    memoryMegabytes,
    DEVICE_MEMORY_FORMATTING_SPEC,
    translationDependencies,
  );

export const formatClientSessionPlatform = (
  platform: UniverseSessionPlatform | null,
  translationDependencies: RAQIV2TranslationDependencies,
): FormattedText =>
  getSingleDimensionBreakdownLabel(
    {
      dimension: RAQIV2Dimension.Platform,
      value: platform ?? undefined,
    },
    translationDependencies,
  ).name;

export const formatClientSessionOperatingSystem = (
  operatingSystem: UniverseSessionOperatingSystem,
  translationDependencies: RAQIV2TranslationDependencies,
): FormattedText =>
  getSingleDimensionBreakdownLabel(
    {
      dimension: RAQIV2Dimension.OperatingSystem,
      value: operatingSystem,
    },
    translationDependencies,
  ).name;

export const formatClientSessionPlaceName = (
  placeName: string | null,
  translationDependencies: RAQIV2TranslationDependencies,
): FormattedText =>
  getSingleDimensionBreakdownLabel(
    {
      dimension: RAQIV2Dimension.Place,
      value: placeName ?? undefined,
    },
    translationDependencies,
  ).name;

/** Explore-style Place chip/option: `Name (id)` when a name is known, otherwise the id. */
export const formatClientSessionPlaceWithId = (
  placeId: string,
  placeName: string | null,
  translationDependencies: RAQIV2TranslationDependencies,
): FormattedText =>
  getSingleDimensionBreakdownLabel(
    {
      dimension: RAQIV2Dimension.Place,
      value: placeId,
      displayValue: placeName ?? undefined,
    },
    translationDependencies,
  ).name;

export const formatClientSessionPlaceOption = (
  placeId: string,
  placesById: ReadonlyMap<string, Pick<UniverseSessionPlace, 'placeName'>>,
  translationDependencies: RAQIV2TranslationDependencies,
): FormattedText =>
  formatClientSessionPlaceWithId(
    placeId,
    placesById.get(placeId)?.placeName ?? null,
    translationDependencies,
  );

export const formatClientSessionPlaceVersion = (
  placeVersion: number | null,
  translationDependencies: RAQIV2TranslationDependencies,
): FormattedText =>
  getSingleDimensionBreakdownLabel(
    {
      dimension: RAQIV2Dimension.PlaceVersion,
      value: placeVersion == null ? undefined : String(placeVersion),
    },
    translationDependencies,
  ).name;

export const formatPlaceLabel = (
  placeName: string | null,
  placeVersion: number | null,
  translationDependencies: RAQIV2TranslationDependencies,
): string => {
  const name = formatClientSessionPlaceName(placeName, translationDependencies);
  const version = formatClientSessionPlaceVersion(placeVersion, translationDependencies);
  return `${name}, ${version}`;
};

export const formatDeviceLabel = (
  session: UniversePlaySession,
  translationDependencies: RAQIV2TranslationDependencies,
): string => {
  const deviceMemory = formatClientSessionDeviceMemory(
    session.clientDeviceRamMegabytes,
    translationDependencies,
  );
  const operatingSystem = formatClientSessionOperatingSystem(session.os, translationDependencies);
  const platform = formatClientSessionPlatform(session.platform, translationDependencies);
  return `${operatingSystem} · ${platform} · ${deviceMemory}`;
};
