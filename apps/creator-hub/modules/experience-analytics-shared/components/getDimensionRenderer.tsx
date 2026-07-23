import {
  RAQIV2Dimension,
  RAQIV2DimensionDisplayConfig,
  RAQIV2DimensionValueType,
  RAQIV2SpecialDimensionRenderer,
  RAQIV2Universe,
} from '@rbx/creator-hub-analytics-config';
import type {
  TBreakdownValueTranslationKeys,
  TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import type {
  FormattedText,
  TranslationKey,
  TranslationKeyAndTagsToFormattedReactNode,
} from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import mapMemoizeSingleParamFunction from '@modules/clients/utils/mapMemoizeSingleParamFunction';
import { Link } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { docs } from '@modules/miscellaneous/urls/creatorHub';
import type { EnumType } from '@modules/miscellaneous/utils/enumUtils';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type {
  RAQIV2NonNullableBreakdownValue,
  RAQIV2TranslationDependencies,
} from '../types/RAQIV2DimensionRenderer';
import type RAQIV2DimensionRenderer from '../types/RAQIV2DimensionRenderer';

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
    if (displayValue) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      return displayValue as FormattedText;
    }
    if (isValidEnumValue(dimensionValueEnum, value)) {
      return translate(dimensionValueToTranslationKey[value].name);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
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
    // oxlint-disable-next-line typescript/prefer-nullish-coalescing @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
    (displayValue || breakdownValue) as FormattedText,
  getBreakdownValueTooltip: () => {},
});

const countryRenderer: RAQIV2DimensionRenderer = {
  name: translationKey('Label.Dimension.Country', TranslationNamespace.Analytics),
  getBreakdownValueName: ({ value: countryCode }, { countryNamesMap }) => {
    // Intentionally ignore displayValue since we retrieve these elsewhere
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
    return (countryNamesMap.get(countryCode) ?? countryCode) as FormattedText;
  },
  getBreakdownValueTooltip: () => {},
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      return localeCode as FormattedText;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
    return localeName as FormattedText;
  },
  getBreakdownValueTooltip: () => {},
};
const placeRenderer: RAQIV2DimensionRenderer = {
  name: translationKey('Label.Dimension.Place', TranslationNamespace.Analytics),
  getBreakdownValueName({ value, displayValue }, { translate }): FormattedText {
    if (value === '-1') {
      return translate(translationKey('Label.InGameCreated', TranslationNamespace.Analytics));
    }
    if (displayValue) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      return `${displayValue} (${value})` as FormattedText;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
    return value as FormattedText;
  },
  getBreakdownValueTooltip: () => {},
  renderEmpty: ({ translate }) =>
    translate(translationKey('Label.Experience', TranslationNamespace.Analytics)),
};
const funnelStepRenderer: RAQIV2DimensionRenderer = {
  name: translationKey('Label.Dimension.FunnelStep', TranslationNamespace.Analytics),
  getBreakdownValueName({ value, displayValue }, { translate }): FormattedText {
    const effectiveStepName =
      displayValue ??
      translate(translationKey('Label.DimensionValue.FunnelStep', TranslationNamespace.Analytics), {
        step: value,
      });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
    return `${value}. ${effectiveStepName}` as FormattedText;
  },
  getBreakdownValueTooltip: () => {},
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
    if (universeId === RAQIV2Universe.Website) {
      return translate(
        translationKey('Label.Dimension.Universe.Website', TranslationNamespace.Analytics),
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
    return (universeNamesMap.get(universeId) ?? universeId) as FormattedText;
  },
  getBreakdownValueTooltip: () => {},
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
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

const formatPlaceVersionBreakdownValue = (
  { value: versionNumber }: RAQIV2NonNullableBreakdownValue,
  { translate }: RAQIV2TranslationDependencies,
): FormattedText => {
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
};

const placeVersionRenderer: RAQIV2DimensionRenderer = {
  ...buildDimensionRendererWithNoPresetValue(
    translationKey('Label.Dimension.PlaceVersion', TranslationNamespace.Analytics),
  ),
  getBreakdownValueName: formatPlaceVersionBreakdownValue,
  getEmptyFilterValuesTooltip: ({ translate }) =>
    translate(translationKey('Label.NoVersionAvailable', TranslationNamespace.Analytics)),
};

const firstSeenPlaceVersionRenderer: RAQIV2DimensionRenderer = {
  ...buildDimensionRendererWithNoPresetValue(
    translationKey('Label.Dimension.FirstSeenPlaceVersion', TranslationNamespace.Analytics),
  ),
  getBreakdownValueName: formatPlaceVersionBreakdownValue,
  renderEmpty: ({ translate }) =>
    translate(translationKey('Label.SelectVersion', TranslationNamespace.Analytics)),
  getEmptyFilterValuesTooltip: ({ translate }) =>
    translate(translationKey('Label.NoVersionAvailable', TranslationNamespace.Analytics)),
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
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      throw new Error(`Unknown special dimension renderer: ${exhaustiveCheck}`);
    }
  }
};

const descriptionLinkByDimension: Partial<Record<TRAQIV2Dimension, string>> = {
  [RAQIV2Dimension.UserSegmentationPayerStatus]: docs.getAnalyticsFilterByMetricsGuideUrl(),
};

const workflowTypeTranslationKeys: Record<string, TranslationKey> = {
  LMaaS: translationKey('Label.WorkflowType.TextGeneration', TranslationNamespace.Analytics),
  ModelGenWorkflow: translationKey(
    'Label.WorkflowType.3DModelGeneration',
    TranslationNamespace.Analytics,
  ),
};

const workflowTypeRenderer: RAQIV2DimensionRenderer = {
  ...buildDimensionRendererWithNoPresetValue(
    translationKey('Label.Dimension.WorkflowType', TranslationNamespace.Analytics),
  ),
  getBreakdownValueName: ({ value, displayValue }, { translate }) =>
    // oxlint-disable-next-line typescript/prefer-nullish-coalescing typescript/no-unsafe-type-assertion
    (displayValue ||
      (workflowTypeTranslationKeys[value]
        ? translate(workflowTypeTranslationKeys[value])
        : value)) as FormattedText,
};

const build = (dimension: TRAQIV2Dimension): RAQIV2DimensionRenderer => {
  if (dimension === RAQIV2Dimension.WorkflowType) {
    return workflowTypeRenderer;
  }
  if (dimension === RAQIV2Dimension.FirstSeenPlaceVersion) {
    return firstSeenPlaceVersionRenderer;
  }

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
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      throw new Error(`Unknown dimension renderer type: ${exhaustiveCheck}`);
    }
  }
};

const getDimensionRenderer = mapMemoizeSingleParamFunction(build);
export default getDimensionRenderer;
