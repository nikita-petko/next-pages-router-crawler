import {
  RAQIV2Dimension,
  RAQIV2DimensionDisplayConfig,
  RAQIV2DimensionValueType,
  RAQIV2UIPseudoDimension,
  RAQIV2UIPseudoDimensionType,
} from '@rbx/creator-hub-analytics-config';
import type {
  RAQIV2BreakdownValueOrder,
  TDimensionSortConfig,
  TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import type {
  FormattedText,
  TranslationKey,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import type { AnnotationsClient } from '@modules/clients/analytics';
import { AnnotationType } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { EnumType } from '@modules/miscellaneous/utils/enumUtils';
import { isValidArrayEnumValue, isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { NonRAQIUIDimension } from '../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import type { TAlertAnnotationSeverityDimension } from './alertAnnotationConfigs';
import { isAlertAnnotationSeverityDimension } from './alertAnnotationConfigs';
import type { TDurationBucketDimension } from './RAQIV2DurationBucketDimensions';
import { isDurationBucketDimension } from './RAQIV2DurationBucketDimensions';
import type { TExperimentDimension } from './RAQIV2ExperimentDimensions';
import { isExperimentDimension } from './RAQIV2ExperimentDimensions';

export const supportedFilterBarDimensionsV1 = [
  NonRAQIUIDimension.Version,
  NonRAQIUIDimension.Text,
] as const;
export type TSupportedFilterBarDimensionsV1 = (typeof supportedFilterBarDimensionsV1)[number];

const supportedMetricFanoutDimensions = [
  RAQIV2UIPseudoDimension.AggregationType,
  RAQIV2UIPseudoDimension.PercentileType,
] as const;
export type TSupportedMetricFanoutDimensions = (typeof supportedMetricFanoutDimensions)[number];

type TUnsupportedFilterDurationBucketDimensions = Exclude<
  TDurationBucketDimension,
  RAQIV2Dimension.CohortDay
>;

export type TRAQISupportedFilterBarDimensions =
  | Exclude<
      RAQIV2Dimension,
      | TUnsupportedFilterDurationBucketDimensions
      | TAlertAnnotationSeverityDimension
      | TExperimentDimension
    >
  | TSupportedMetricFanoutDimensions;

export const isFilterableDimension = (
  dimension: TRAQIV2Dimension,
): dimension is TRAQISupportedFilterBarDimensions => {
  return (
    !isDurationBucketDimension(dimension) &&
    !isAlertAnnotationSeverityDimension(dimension) &&
    !isExperimentDimension(dimension)
  );
};

export const raqiSupportedFilterBarDimensions: TRAQISupportedFilterBarDimensions[] = [
  ...Object.values(RAQIV2Dimension),
  ...supportedMetricFanoutDimensions,
].filter((dimension) => isFilterableDimension(dimension));

export const getFilterBarDimensionForRAQIV2Dimension = (
  dimension: TRAQIV2Dimension,
): TRAQISupportedFilterBarDimensions | null => {
  // if (!dimension) {
  //   logAnalyticsError('Dimension is null');
  //   return null;
  // }
  if (isDurationBucketDimension(dimension)) {
    logAnalyticsError('DurationBucketDimension should not be used in filter bar');
    return null;
  }
  if (isAlertAnnotationSeverityDimension(dimension)) {
    logAnalyticsError('AlertAnnotationSeverityDimensions should not be used in filter bar');
    return null;
  }
  if (isExperimentDimension(dimension)) {
    logAnalyticsError('ExperimentDimensions should not be used in filter bar');
    return null;
  }
  if (
    isValidEnumValue(RAQIV2Dimension, dimension) ||
    isValidArrayEnumValue(supportedMetricFanoutDimensions, dimension)
  ) {
    // shared dimension or metric fanout ui pseudodimension
    return dimension;
  }

  const { pseudoDimensionConfig } = RAQIV2DimensionDisplayConfig[dimension];
  const { type: pseudoDimensionType } = pseudoDimensionConfig;
  if (pseudoDimensionType !== RAQIV2UIPseudoDimensionType.TopNBreakdown) {
    return null;
  }

  const filterDimension = pseudoDimensionConfig.filterAndBreakdownDimension;
  if (!isFilterableDimension(filterDimension)) {
    logAnalyticsError(`Dimension ${filterDimension} is not supported in filter bar`);
    return null;
  }
  return filterDimension;
};

export const nonRAQISupportedFilterBarDimensions = [...supportedFilterBarDimensionsV1] as const;
export type TNonRAQISupportedFilterBarDimensions =
  (typeof nonRAQISupportedFilterBarDimensions)[number];

export type TSupportedFilterBarDimensions =
  | TNonRAQISupportedFilterBarDimensions
  | TRAQISupportedFilterBarDimensions;

export enum OptionType {
  /** A couple error report page dimensions that have not been migrated to RAQI yet */
  Legacy = 'Legacy',
  /** A dimension with fixed values in an enum, which can use checkboxes or dropdown menus depending on cardinality */
  RAQIV2StaticEnum = 'RAQIV2StaticEnum',
  /** A dimension with dynamic values that can use either checkboxes or dropdown menus depending on cardinality */
  RAQIV2DynamicEnum = 'RAQIV2DynamicEnum',
}

export type FilterDimensionConfigV1 = {
  optionType: OptionType.Legacy;
  options: string[];
  blankOption: string;
  renderOptionFn: (translate: TranslationKeyToFormattedText) => (option: string) => FormattedText;
  dimensionNameKey: TranslationKey;
  fetchDynamicOptions?: {
    type: 'annotations';
    fetch: (
      client: AnnotationsClient,
      universeId: number,
      placeId: number,
      startTime: Date,
      endTime: Date,
    ) => Promise<string[]> | null;
  };
};

type SingleOrMultipleConfig<TEnum> = {
  multiple: boolean;
  blankOption?: TEnum;
};

export type EnumFilterDimensionConfigV2<TEnum extends string> = {
  optionType: OptionType.RAQIV2StaticEnum;
  raqiDimension: TRAQIV2Dimension;
  enumOptions: TEnum[];
  optionOrder: Array<TEnum>;
} & SingleOrMultipleConfig<TEnum>;

export type DynamicEnumFilterDimensionConfigV2 = {
  optionType: OptionType.RAQIV2DynamicEnum;
  raqiDimension: RAQIV2Dimension;
  singular?: boolean;
};

export type FilterDimensionConfigV2<TEnum extends string> =
  | EnumFilterDimensionConfigV2<TEnum>
  | DynamicEnumFilterDimensionConfigV2;

export const LegacyFilterDimensionConfigs: Record<
  TNonRAQISupportedFilterBarDimensions,
  FilterDimensionConfigV1
> = {
  [NonRAQIUIDimension.Version]: {
    optionType: OptionType.Legacy,
    dimensionNameKey: translationKey(
      'Label.Dimension.PlaceVersion',
      TranslationNamespace.Analytics,
    ),
    options: [],
    blankOption: 'Select Version',
    renderOptionFn() {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      return (option: string) => option as FormattedText;
    },
    fetchDynamicOptions: {
      type: 'annotations',
      fetch(annotationClient: AnnotationsClient, universeId, placeId, startTime, endTime) {
        return annotationClient
          .getAnnotations({
            annotationType: AnnotationType.PlaceVersion,
            resource: {
              id: universeId,
              type: ChartResourceType.Universe,
            },
            placeId,
            startUtc: startTime,
            endUtc: endTime,
          })
          .then((annotations) => {
            return annotations
              .sort((a, b) => {
                const versionA = a.metadata?.placeVersion?.versionNumber ?? 0;
                const versionB = b.metadata?.placeVersion?.versionNumber ?? 0;
                return versionB - versionA; // Descending order
              })
              .map((annotation) => {
                const versionNumber = annotation.metadata?.placeVersion?.versionNumber;
                return `V${versionNumber}`;
              });
          });
      },
    },
  },
  [NonRAQIUIDimension.Text]: {
    optionType: OptionType.Legacy,
    dimensionNameKey: translationKey('Label.TextFilterPlaceholder', TranslationNamespace.Analytics),
    options: [],
    blankOption: '',
    renderOptionFn() {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      return (option) => option as FormattedText;
    },
  },
};

export const getFilterOptionsForEnumType = <TEnum extends string>(
  singular: boolean,
  dimensionValues: EnumType<TEnum>,
  breakdownOrdering: RAQIV2BreakdownValueOrder | TDimensionSortConfig<string>,
  filterSupported: Partial<Record<TEnum, boolean>> | undefined,
): { enumOptions: TEnum[]; optionOrder: TEnum[]; blankOption?: TEnum } => {
  // Get all enum values
  const enumOptions = Object.values(dimensionValues).filter((option) => {
    const supported = filterSupported?.[option];
    // If supported is undefined, default to true
    return supported ?? true;
  });

  // Determine option order based on breakdownOrdering
  let optionOrder: TEnum[] = [];
  if (typeof breakdownOrdering === 'object' && 'completeOrder' in breakdownOrdering) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
    optionOrder = breakdownOrdering.completeOrder as TEnum[];
  } else if (typeof breakdownOrdering === 'object' && 'partialOrder' in breakdownOrdering) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
    optionOrder = breakdownOrdering.partialOrder as TEnum[];
  }
  const enumOptionsSet = new Set(enumOptions);
  optionOrder = optionOrder.filter((option) => enumOptionsSet.has(option));

  // Determine blank option
  const [firstOption] = optionOrder;
  const [firstEnumValue] = enumOptions;
  const blankOption = singular ? (firstOption ?? firstEnumValue) : undefined;

  return { enumOptions, optionOrder, blankOption };
};

export const getRAQIFilterConfig = (
  dimension: TRAQISupportedFilterBarDimensions,
): FilterDimensionConfigV2<string> => {
  const { valueType: dimensionValueType, singular } = RAQIV2DimensionDisplayConfig[dimension];
  switch (dimensionValueType) {
    case RAQIV2DimensionValueType.Enum: {
      // TODO(gperkins@20240725): Share code with useRAQIV2DimensionChoiceRenderBundle
      const { dimensionValues, breakdownOrdering, filterSupported } =
        RAQIV2DimensionDisplayConfig[dimension];
      const { enumOptions, optionOrder, blankOption } = getFilterOptionsForEnumType(
        singular ?? false,
        dimensionValues,
        breakdownOrdering,
        filterSupported,
      );
      return {
        optionType: OptionType.RAQIV2StaticEnum,
        raqiDimension: dimension,
        enumOptions,
        optionOrder,
        multiple: !singular,
        blankOption,
      };
    }
    case RAQIV2DimensionValueType.DynamicWithPreset:
    case RAQIV2DimensionValueType.Dynamic: {
      if (isValidEnumValue(RAQIV2UIPseudoDimension, dimension)) {
        const { pseudoDimensionConfig } = RAQIV2DimensionDisplayConfig[dimension];
        if (pseudoDimensionConfig.type === RAQIV2UIPseudoDimensionType.TopNBreakdown) {
          return {
            optionType: OptionType.RAQIV2DynamicEnum,
            raqiDimension: pseudoDimensionConfig.filterAndBreakdownDimension,
            singular,
          };
        }
        throw new Error(
          `Unhandled pseudo dimension ${dimension} with type ${pseudoDimensionConfig.type}`,
        );
      }
      return {
        optionType: OptionType.RAQIV2DynamicEnum,
        raqiDimension: dimension,
        singular,
      };
    }
    default: {
      const exhaustiveCheck: never = dimensionValueType;
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      throw new Error(`Unhandled dimension value type ${exhaustiveCheck}`);
    }
  }
};

export const isDynamicFilterDimension = (dimension: TRAQISupportedFilterBarDimensions): boolean => {
  const config = getRAQIFilterConfig(dimension);
  return config.optionType === OptionType.RAQIV2DynamicEnum;
};

export const getRAQIOrLegacyFilterConfig = (dimension: TSupportedFilterBarDimensions) => {
  if (isValidArrayEnumValue(raqiSupportedFilterBarDimensions, dimension)) {
    return getRAQIFilterConfig(dimension);
  }
  return LegacyFilterDimensionConfigs[dimension];
};
