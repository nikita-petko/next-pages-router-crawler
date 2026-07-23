import React from 'react';
import {
  FormattedText,
  TranslationKey,
  translationKey,
  TranslationKeyAndTagsToFormattedReactNode,
} from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Link } from '@modules/miscellaneous/common';
import { EnumType, isValidEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import mapMemoizeSingleParamFunction from '@modules/clients/utils/mapMemoizeSingleParamFunction';
import {
  TRAQIV2Dimension,
  TBreakdownValueTranslationKeys,
  RAQIV2SpecialDimensionRenderer,
  RAQIV2DimensionDisplayConfig,
  RAQIV2DimensionValueType,
  RAQIV2Dimension,
  RAQIV2Universe,
} from '@rbx/creator-hub-analytics-config';
import { docs } from '@modules/miscellaneous/common/urls/creatorHub';
import RAQIV2DimensionRenderer, {
  RAQIV2NonNullableBreakdownValue,
  RAQIV2TranslationDependencies,
} from '../types/RAQIV2DimensionRenderer';

const buildDimensionRenderer = <TDimensionValues extends string>(
  name: TranslationKey,
  dimensionValueToTranslationKey: Record<TDimensionValues, TBreakdownValueTranslationKeys>,
  dimensionValueEnum: EnumType<TDimensionValues>,
  emptyFilterBarKey?: TranslationKey,
  dimensionDescriptionKey?: TranslationKey,
  dimensionDescriptionLink?: string,
): RAQIV2DimensionRenderer => {
  const getBreakdownValueName = (
    { value, displayValue }: RAQIV2NonNullableBreakdownValue,
    { translate }: RAQIV2TranslationDependencies,
  ) => {
    if (displayValue) return displayValue as FormattedText;
    if (isValidEnumValue(dimensionValueEnum, value)) {
      return translate(dimensionValueToTranslationKey[value].name);
    }
    return value as FormattedText;
  };

  const getBreakdownValueTooltip = (
    { value }: RAQIV2NonNullableBreakdownValue,
    { translate }: RAQIV2TranslationDependencies,
  ) => {
    if (isValidEnumValue(dimensionValueEnum, value)) {
      const translationKeys = dimensionValueToTranslationKey[value];
      return translationKeys.tooltip ? translate(translationKeys.tooltip) : undefined;
    }
    return undefined;
  };

  const getBreakdownValueTooltipWithLink = (
    { value }: RAQIV2NonNullableBreakdownValue,
    translateHTML: TranslationKeyAndTagsToFormattedReactNode,
    link: string,
  ) => {
    if (isValidEnumValue(dimensionValueEnum, value)) {
      const translationKeys = dimensionValueToTranslationKey[value];
      return translationKeys.tooltip
        ? translateHTML(translationKeys.tooltip, [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content(chunks) {
                return <Link href={link}>{chunks}</Link>;
              },
            },
          ])
        : null;
    }
    return null;
  };

  const renderEmpty = emptyFilterBarKey
    ? (dependencies: RAQIV2TranslationDependencies) => {
        const { translate } = dependencies;
        return translate(emptyFilterBarKey);
      }
    : undefined;

  const getBreakdownDescription = dimensionDescriptionKey
    ? (dependencies: RAQIV2TranslationDependencies) => {
        const { translate, translateHTML } = dependencies;
        return dimensionDescriptionLink
          ? translateHTML(dimensionDescriptionKey, [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content(chunks) {
                  return <Link href={dimensionDescriptionLink}>{chunks}</Link>;
                },
              },
            ])
          : translate(dimensionDescriptionKey);
      }
    : undefined;

  return {
    name,
    getBreakdownDescription,
    getBreakdownValueName,
    getBreakdownValueTooltip,
    getBreakdownValueTooltipWithLink,
    renderEmpty,
  };
};

const buildDimensionRendererWithNoPresetValue = (
  name: TranslationKey,
): RAQIV2DimensionRenderer => ({
  name,
  getBreakdownValueName: ({ value: breakdownValue, displayValue }) =>
    (displayValue || breakdownValue) as FormattedText,
  getBreakdownValueTooltip: () => undefined,
});

const countryRenderer: RAQIV2DimensionRenderer = {
  name: translationKey('Label.Dimension.Country', TranslationNamespace.Analytics),
  getBreakdownValueName: ({ value: countryCode }, { countryNamesMap }) => {
    // Intentionally ignore displayValue since we retrieve these elsewhere
    return (countryNamesMap.get(countryCode) || countryCode) as FormattedText;
  },
  getBreakdownValueTooltip: () => undefined,
};
const localeRenderer: RAQIV2DimensionRenderer = {
  name: translationKey('Label.Dimension.Locale', TranslationNamespace.Analytics),
  getBreakdownValueName: ({ value: localeCode }, { localesMap }) => {
    // Intentionally ignore displayValue since we retrieve these elsewhere
    const localeName = localesMap.get(localeCode);
    if (!localeName) {
      // TODO(gperkins@20240514): Convert locale to a dynamic raqi dimension
      // TODO(gperkins@20241031): DSA-2507 -- would like to use logUnknownLocaleCode here,
      //    but we have no unifiedLoggerClient
      return localeCode as FormattedText;
    }
    return localeName as FormattedText;
  },
  getBreakdownValueTooltip: () => undefined,
};
const placeRenderer: RAQIV2DimensionRenderer = {
  name: translationKey('Label.Dimension.Place', TranslationNamespace.Analytics),
  getBreakdownValueName({ value, displayValue }, { translate }): FormattedText {
    if (value === '-1') {
      return translate(translationKey('Label.InGameCreated', TranslationNamespace.Analytics));
    }
    if (displayValue) {
      return `${displayValue} (${value})` as FormattedText;
    }
    return value as FormattedText;
  },
  getBreakdownValueTooltip: () => undefined,
  renderEmpty: ({ translate }) =>
    translate(translationKey('Label.Experience', TranslationNamespace.Analytics)),
  getEmptyFilterValuesTooltip: ({ translate }) =>
    translate(translationKey('Label.Experience.EmptyFilterValues', TranslationNamespace.Analytics)),
};
const funnelStepRenderer: RAQIV2DimensionRenderer = {
  name: translationKey('Label.Dimension.FunnelStep', TranslationNamespace.Analytics),
  getBreakdownValueName({ value, displayValue }, { translate }): FormattedText {
    const effectiveStepName =
      displayValue ??
      translate(translationKey('Label.DimensionValue.FunnelStep', TranslationNamespace.Analytics), {
        step: value,
      });
    return `${value}. ${effectiveStepName}` as FormattedText;
  },
  getBreakdownValueTooltip: () => undefined,
};

const thumbnailRenderer: RAQIV2DimensionRenderer = {
  ...buildDimensionRendererWithNoPresetValue(
    translationKey('Label.Dimension.ThumbnailAsset', TranslationNamespace.Analytics),
  ),
  getBreakdownValueImageUrl: ({ value: id }, { thumbnailUrlsMap }) => {
    return thumbnailUrlsMap?.get(id);
  },
};

const universeNameRenderer: RAQIV2DimensionRenderer = {
  name: translationKey('Label.Dimension.UniverseName', TranslationNamespace.Analytics),
  getBreakdownValueName: ({ value: universeId }, { universeNamesMap, translate }) => {
    // Special case: If universe ID is 0, render as "Website"

    if (universeId === RAQIV2Universe.Website) {
      return translate(
        translationKey('Label.Dimension.Universe.Website', TranslationNamespace.Analytics),
      );
    }
    return (universeNamesMap.get(universeId) || universeId) as FormattedText;
  },
  getBreakdownValueTooltip: () => undefined,
};

const cohortDayRenderer: RAQIV2DimensionRenderer = {
  ...buildDimensionRendererWithNoPresetValue(
    translationKey('Label.Dimension.CohortDay', TranslationNamespace.Analytics),
  ),
  getBreakdownValueName: ({ value: day }, { translate }) => {
    return translate(translationKey('Label.Dimension.CohortDay', TranslationNamespace.Analytics), {
      day,
    });
  },
};

const cohortWeekRenderer: RAQIV2DimensionRenderer = {
  ...buildDimensionRendererWithNoPresetValue(
    translationKey('Label.Dimension.CohortWeek', TranslationNamespace.Analytics),
  ),
  getBreakdownValueName: ({ value: week }, { translate }) => {
    return translate(translationKey('Label.Dimension.CohortWeek', TranslationNamespace.Analytics), {
      week,
    });
  },
};

// Shared function for getBreakdownValueName for the Experience Event time renderers
const timestampToNumericDate = (
  { value: day }: RAQIV2NonNullableBreakdownValue,
  { locale }: RAQIV2TranslationDependencies,
) => {
  return new Date(Number(day)).toLocaleString([locale, 'en-us'], {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }) as FormattedText;
};

const experienceEventStartTimeRenderer: RAQIV2DimensionRenderer = {
  ...buildDimensionRendererWithNoPresetValue(
    translationKey('Label.Dimension.StartTimeUtc', TranslationNamespace.Analytics),
  ),
  getBreakdownValueName: timestampToNumericDate,
};

const experienceEventEndTimeRenderer: RAQIV2DimensionRenderer = {
  ...buildDimensionRendererWithNoPresetValue(
    translationKey('Label.Dimension.EndTimeUtc', TranslationNamespace.Analytics),
  ),
  getBreakdownValueName: timestampToNumericDate,
};

const placeVersionRenderer: RAQIV2DimensionRenderer = {
  ...buildDimensionRendererWithNoPresetValue(
    translationKey('Label.Dimension.PlaceVersion', TranslationNamespace.Analytics),
  ),
  getBreakdownValueName: ({ value: versionNumber }, { translate }) => {
    if (versionNumber === 'Other') {
      return translate(
        translationKey('Label.Dimension.PlaceVersion.Previous', TranslationNamespace.Analytics),
      );
    }
    return translate(
      translationKey('Label.Dimension.PlaceVersion.Value', TranslationNamespace.Analytics),
      {
        versionNumber,
      },
    );
  },
};

const buildSpecialBase = (type: RAQIV2SpecialDimensionRenderer): RAQIV2DimensionRenderer => {
  switch (type) {
    case RAQIV2SpecialDimensionRenderer.FunnelStep:
      return funnelStepRenderer;
    case RAQIV2SpecialDimensionRenderer.Place:
      return placeRenderer;
    case RAQIV2SpecialDimensionRenderer.Locale:
      return localeRenderer;
    case RAQIV2SpecialDimensionRenderer.Country:
      return countryRenderer;
    case RAQIV2SpecialDimensionRenderer.Thumbnail:
      return thumbnailRenderer;
    case RAQIV2SpecialDimensionRenderer.Universe:
      return universeNameRenderer;
    case RAQIV2SpecialDimensionRenderer.CohortDay:
      return cohortDayRenderer;
    case RAQIV2SpecialDimensionRenderer.CohortWeek:
      return cohortWeekRenderer;
    case RAQIV2SpecialDimensionRenderer.ExperienceEventStartTime:
      return experienceEventStartTimeRenderer;
    case RAQIV2SpecialDimensionRenderer.ExperienceEventEndTime:
      return experienceEventEndTimeRenderer;
    case RAQIV2SpecialDimensionRenderer.PlaceVersion:
      return placeVersionRenderer;
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unknown special dimension renderer: ${exhaustiveCheck}`);
    }
  }
};

const descriptionLinkByDimension: Partial<Record<TRAQIV2Dimension, string>> = {
  [RAQIV2Dimension.UserSegmentationPayerStatus]: docs.getAnalyticsFilterByMetricsGuideUrl(),
};

const build = (dimension: TRAQIV2Dimension): RAQIV2DimensionRenderer => {
  const { renderer, valueType, name } = RAQIV2DimensionDisplayConfig[dimension];
  const descriptionLink = descriptionLinkByDimension[dimension];

  if (typeof renderer === 'string' && isValidEnumValue(RAQIV2SpecialDimensionRenderer, renderer)) {
    return { ...buildSpecialBase(renderer), name };
  }

  switch (valueType) {
    case RAQIV2DimensionValueType.DynamicWithPreset:
    case RAQIV2DimensionValueType.Enum:
      return buildDimensionRenderer(
        name,
        renderer.breakdownValueKeys,
        RAQIV2DimensionDisplayConfig[dimension].dimensionValues,
        renderer.emptyFilterKey,
        renderer.dimensionDescriptionKey,
        descriptionLink,
      );
    case RAQIV2DimensionValueType.Dynamic:
      return buildDimensionRendererWithNoPresetValue(name);
    default: {
      const exhaustiveCheck: never = valueType;
      throw new Error(`Unknown dimension renderer type: ${exhaustiveCheck}`);
    }
  }
};

const getDimensionRenderer = mapMemoizeSingleParamFunction(build);
export default getDimensionRenderer;
