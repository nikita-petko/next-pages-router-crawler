import { Locale } from '@rbx/intl';
import { NumberFormatter } from '@rbx/core';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { FallbackValue, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { RAQIV2ChartSpec } from '@modules/experience-analytics-shared';
import {
  FormattedText,
  TranslationKeyOrFormattedText,
  TranslationKeyOrFormattedTextType,
  TranslationKeyToFormattedText,
  translationKey,
} from '@modules/analytics-translations';
import { ChartUnit, ChartUnitAggregationType } from './types/ChartTypes';

const fourDecimalDigits: Intl.NumberFormatOptions = {
  minimumFractionDigits: 3,
  maximumFractionDigits: 4,
};

const threeDecimalDigits: Intl.NumberFormatOptions = {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
};
const twoDecimalDigits: Intl.NumberFormatOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};
const oneDecimalDigit: Intl.NumberFormatOptions = {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
};
const roundToWholeNumber: Intl.NumberFormatOptions = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
};

type TSuffixType = 'long' | 'short';
type TSuffixFormattingConfig = Record<TSuffixType, null | TranslationKeyOrFormattedText>;

const fourDecimalFormattingConfig: TNumberFormatSpec = {
  numberFormatOptions: {
    style: 'decimal',
    ...fourDecimalDigits,
  },
};

const threeDecimalFormattingConfig: TNumberFormatSpec = {
  numberFormatOptions: {
    style: 'decimal',
    ...threeDecimalDigits,
  },
};

const oneDecimalFormattingConfig: TNumberFormatSpec = {
  numberFormatOptions: {
    style: 'decimal',
    ...oneDecimalDigit,
  },
};

const twoDecimalFormattingConfig: TNumberFormatSpec = {
  numberFormatOptions: {
    style: 'decimal',
    ...twoDecimalDigits,
  },
  isRounded: false,
};

const roundNumberFormattingConfig: TNumberFormatSpec = {
  numberFormatOptions: {},
  isRounded: true,
};

const percentageFormatterConfig: TNumberFormatSpec = {
  numberFormatOptions: {
    style: 'percent',
    ...twoDecimalDigits,
  },
};

enum NumberFormatterDynamicOverrides {
  ForceTwoDecimalDigitsWhenRatio = 'ForceTwoDecimalDigitsWhenRatio',
  ForceTwoDecimalDigitsWhenAverageUnder100 = 'ForceTwoDecimalDigitsWhenAverageUnder100',
  UseMetadataCurrencyName = 'UseMetadataCurrencyName',
  UseChineseYuanSymbolIfLuobu = 'UseChineseYuanSymbolIfLuobu',
}

type TNumberFormatSpec = {
  numberFormatOptions: Intl.NumberFormatOptions;
  isRounded?: boolean;
  prefix?: TranslationKeyOrFormattedText;
  suffix?: TSuffixFormattingConfig;
  dynamicOverrides?: NumberFormatterDynamicOverrides[];
};

type TNumberFormatSpecMap = Record<
  ChartUnit,
  (value: number, aggType: ChartUnitAggregationType) => TNumberFormatSpec
>;

const numberUnitFormatterConfig: TNumberFormatSpecMap = {
  [ChartUnit.Percentage]: () => percentageFormatterConfig,
  [ChartUnit.LegacyPercentage]: () => percentageFormatterConfig,
  [ChartUnit.RoughPercentage]: () => ({
    numberFormatOptions: {
      style: 'percent',
      ...oneDecimalDigit,
    },
  }),
  [ChartUnit.WholePercentage]: () => ({
    numberFormatOptions: {
      style: 'percent',
      ...roundToWholeNumber,
    },
  }),
  [ChartUnit.Days]: () => ({
    ...fourDecimalFormattingConfig,
    suffix: {
      long: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.DaysSuffix', TranslationNamespace.Analytics),
      },
      short: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.DaysSuffix', TranslationNamespace.Analytics),
      },
    },
  }),
  [ChartUnit.Hours]: () => ({
    ...oneDecimalFormattingConfig,
    suffix: {
      long: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.HoursSuffix', TranslationNamespace.Analytics),
      },
      short: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.HoursSuffix', TranslationNamespace.Analytics),
      },
    },
  }),
  [ChartUnit.Seconds]: () => ({
    ...oneDecimalFormattingConfig,
    suffix: {
      long: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.SecondsSuffix', TranslationNamespace.Analytics),
      },
      short: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.SecondsSuffix', TranslationNamespace.Analytics),
      },
    },
  }),
  [ChartUnit.Milliseconds]: () => ({
    ...threeDecimalFormattingConfig,
    suffix: {
      long: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.MillisecondsSuffix', TranslationNamespace.Analytics),
      },
      short: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.MillisecondsSuffix', TranslationNamespace.Analytics),
      },
    },
  }),
  [ChartUnit.Minutes]: () => ({
    ...oneDecimalFormattingConfig,
    suffix: {
      long: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.MinutesSuffix', TranslationNamespace.Analytics),
      },
      short: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.MinsSuffix', TranslationNamespace.Analytics),
      },
    },
  }),
  [ChartUnit.Robux]: () => ({
    ...roundNumberFormattingConfig,
    dynamicOverrides: [
      NumberFormatterDynamicOverrides.ForceTwoDecimalDigitsWhenRatio,
      NumberFormatterDynamicOverrides.ForceTwoDecimalDigitsWhenAverageUnder100,
      NumberFormatterDynamicOverrides.UseChineseYuanSymbolIfLuobu,
    ],
  }),
  [ChartUnit.Bytes]: () => ({
    ...roundNumberFormattingConfig,
    suffix: {
      long: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.BytesSuffix', TranslationNamespace.Analytics),
      },
      short: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.BytesSuffix', TranslationNamespace.Analytics),
      },
    },
  }),
  [ChartUnit.KiloBytes]: () => ({
    ...roundNumberFormattingConfig,
    suffix: {
      long: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.KilobytesSuffix', TranslationNamespace.Analytics),
      },
      short: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.KilobytesSuffix', TranslationNamespace.Analytics),
      },
    },
  }),
  [ChartUnit.MegaBytes]: () => ({
    ...roundNumberFormattingConfig,
    suffix: {
      long: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.MegabytesSuffix', TranslationNamespace.Analytics),
      },
      short: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.MegabytesSuffix', TranslationNamespace.Analytics),
      },
    },
  }),
  [ChartUnit.Cores]: () => twoDecimalFormattingConfig,
  [ChartUnit.Gigabytes]: () => ({
    ...twoDecimalFormattingConfig,
    suffix: {
      long: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.GigabytesSuffix', TranslationNamespace.Analytics),
      },
      short: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.GigabytesSuffix', TranslationNamespace.Analytics),
      },
    },
  }),
  [ChartUnit.Currency]: () => ({
    numberFormatOptions: {
      currency: 'USD',
      style: 'currency',
      ...twoDecimalDigits,
    },
  }),
  [ChartUnit.Players]: () => ({
    ...roundNumberFormattingConfig,
    suffix: {
      long: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.PlayersSuffix', TranslationNamespace.Analytics),
      },
      short: null,
    },
  }),
  [ChartUnit.Sessions]: () => ({
    ...roundNumberFormattingConfig,
    suffix: {
      long: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.SessionsSuffix', TranslationNamespace.Analytics),
      },
      short: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.SessionsSuffix', TranslationNamespace.Analytics),
      },
    },
  }),
  [ChartUnit.Impressions]: () => roundNumberFormattingConfig,
  [ChartUnit.Teleports]: () => roundNumberFormattingConfig,
  [ChartUnit.VideoViews]: () => ({
    ...roundNumberFormattingConfig,
    suffix: {
      long: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.VideoViewsSuffix', TranslationNamespace.Analytics),
      },
      short: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.VideoViewsSuffix', TranslationNamespace.Analytics),
      },
    },
  }),
  [ChartUnit.RequestUnits]: () => ({
    ...roundNumberFormattingConfig,
    suffix: {
      long: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.RequestUnitsSuffix', TranslationNamespace.Analytics),
      },
      short: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.RequestUnitsSuffix', TranslationNamespace.Analytics),
      },
    },
  }),
  [ChartUnit.Requests]: () => ({
    ...roundNumberFormattingConfig,
    suffix: {
      long: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.RequestsSuffix', TranslationNamespace.Analytics),
      },
      short: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.RequestsSuffix', TranslationNamespace.Analytics),
      },
    },
  }),
  [ChartUnit.FramesPerSecond]: () => roundNumberFormattingConfig,
  [ChartUnit.Unknown]: () => roundNumberFormattingConfig,
  [ChartUnit.Results]: () => ({
    ...roundNumberFormattingConfig,
    suffix: {
      long: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.Results', TranslationNamespace.Analytics),
      },
      short: {
        type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
        key: translationKey('Label.Results', TranslationNamespace.Analytics),
      },
    },
  }),
  [ChartUnit.Score]: () => roundNumberFormattingConfig,
  [ChartUnit.Sales]: () => roundNumberFormattingConfig,
  [ChartUnit.Cancellations]: () => roundNumberFormattingConfig,
  [ChartUnit.Items]: () => roundNumberFormattingConfig,
  [ChartUnit.InExperienceCurrency]: () => ({
    ...roundNumberFormattingConfig,
    dynamicOverrides: [NumberFormatterDynamicOverrides.UseMetadataCurrencyName],
  }),
};

const fallbackNoDataSeriesValueConfig: Record<FallbackValue, 'N/A' | 0> = {
  [FallbackValue.Invalid]: 'N/A',
  [FallbackValue.NA]: 'N/A',
  [FallbackValue.Zero]: 0,
};

const scientificNotationThreshold = 1e12;

export const getFallbackNoDataSeriesValue = (noDataFallback: FallbackValue) => {
  return fallbackNoDataSeriesValueConfig[noDataFallback];
};

export const formatNumberWithUnit = (
  value: number,
  numberFormatterSpec: TNumberFormatSpec,
  locale: Locale,
): string => {
  const localizedNumberFormatter = new NumberFormatter(locale, '');
  const roundValueIfNeeded = numberFormatterSpec.isRounded ? Math.round(value) : value;

  if (Math.abs(roundValueIfNeeded) >= scientificNotationThreshold) {
    return localizedNumberFormatter
      .getCustomNumber(roundValueIfNeeded, {
        notation: 'scientific',
        ...twoDecimalDigits,
        style: numberFormatterSpec.numberFormatOptions.style,
        currency: numberFormatterSpec.numberFormatOptions.currency,
      })
      .toString();
  }

  const formattedNumber = localizedNumberFormatter
    .getCustomNumber(roundValueIfNeeded, numberFormatterSpec.numberFormatOptions)
    .toString();
  return formattedNumber;
};

export const formatAbbreviatedNumber = (value: number, locale: Locale): string => {
  const localizedNumberFormatter = new NumberFormatter(locale, '');
  const abbreviations = {
    thousand: {
      threshold: 1000,
      value: 'K',
    },
    million: {
      threshold: 1000000,
      value: 'M',
    },
    billion: {
      threshold: 1000000000,
      value: 'B',
    },
    trillion: {
      threshold: 1000000000000,
      value: 'T',
    },
  };

  let quotient = value;
  let abbreviation = '';
  if (value >= abbreviations.trillion.threshold) {
    abbreviation = abbreviations.trillion.value;
    quotient = value / abbreviations.trillion.threshold;
  } else if (value >= abbreviations.billion.threshold) {
    abbreviation = abbreviations.billion.value;
    quotient = value / abbreviations.billion.threshold;
  } else if (value >= abbreviations.million.threshold) {
    abbreviation = abbreviations.million.value;
    quotient = value / abbreviations.million.threshold;
  } else if (value >= abbreviations.thousand.threshold) {
    abbreviation = abbreviations.thousand.value;
    quotient = value / abbreviations.thousand.threshold;
  }

  // Then return the localized version of the number
  return `${localizedNumberFormatter.getCustomNumber(quotient, {
    style: 'decimal',
    minimumFractionDigits: abbreviation === '' ? 0 : 1, // show .0 if it is abbreviated
    maximumFractionDigits: 1,
  })}${abbreviation}`;
};

type TContextFormattingSpec = {
  unit: ChartUnit;
  type: ChartUnitAggregationType;
  abbreviate?: boolean;
  suffix?: TSuffixType;
};

const getCurrencyNameFromChartSpec = (
  spec: Pick<RAQIV2ChartSpec, 'filter'> | null,
): FormattedText | null => {
  if (!spec) {
    return null;
  }
  const currencyFilterValue = spec.filter?.find(
    (f) => f.dimension === RAQIV2Dimension.CurrencyType,
  )?.values;
  if (currencyFilterValue?.length === 1) {
    return currencyFilterValue[0] as string as FormattedText;
  }
  return null;
};

// Exported for testing
export const getNumberUnitFormatterConfig = (
  value: number,
  contextFormattingSpec: TContextFormattingSpec,
  isInLuobuEnvironment: boolean,
  numberContextMetadata?: TNumberContextMetadata,
): TNumberFormatSpec => {
  const baseConfig = numberUnitFormatterConfig[contextFormattingSpec.unit](
    value,
    contextFormattingSpec.type,
  );

  return (
    baseConfig.dynamicOverrides?.reduce((accConfig, override) => {
      switch (override) {
        case NumberFormatterDynamicOverrides.ForceTwoDecimalDigitsWhenRatio:
          if (
            contextFormattingSpec.type === ChartUnitAggregationType.Ratio ||
            contextFormattingSpec.type === ChartUnitAggregationType.AverageRatio
          ) {
            return {
              ...accConfig,
              ...twoDecimalFormattingConfig,
            };
          }
          return accConfig;
        case NumberFormatterDynamicOverrides.ForceTwoDecimalDigitsWhenAverageUnder100:
          if (contextFormattingSpec.type === ChartUnitAggregationType.Average && value < 100) {
            return {
              ...accConfig,
              ...twoDecimalFormattingConfig,
            };
          }
          return accConfig;
        case NumberFormatterDynamicOverrides.UseMetadataCurrencyName: {
          const currencyName = getCurrencyNameFromChartSpec(
            numberContextMetadata?.chartSpec ?? null,
          );
          if (currencyName) {
            return {
              ...accConfig,
              suffix: {
                long: {
                  type: TranslationKeyOrFormattedTextType.DynamicFormattedText,
                  text: currencyName,
                },
                short: {
                  type: TranslationKeyOrFormattedTextType.DynamicFormattedText,
                  text: currencyName,
                },
              },
            };
          }
          return accConfig;
        }
        case NumberFormatterDynamicOverrides.UseChineseYuanSymbolIfLuobu:
          if (isInLuobuEnvironment) {
            return {
              ...accConfig,
              prefix: {
                type: TranslationKeyOrFormattedTextType.DynamicFormattedText,
                text: '¥' as FormattedText,
              },
            };
          }
          return accConfig;
        default:
          return accConfig;
      }
    }, baseConfig) ?? baseConfig
  );
};

const translateIfKey = (
  key: TranslationKeyOrFormattedText,
  translate: TranslationKeyToFormattedText,
) => {
  return key.type === TranslationKeyOrFormattedTextType.PredefinedTranslationKey
    ? translate(key.key)
    : key.text;
};

const formatNumberFromSpec = (
  givenValue: number,
  contextFormattingSpec: TContextFormattingSpec,
  locale: Locale,
  translate: TranslationKeyToFormattedText,
  isInLuobuEnvironment: boolean,
  numberContextMetadata?: TNumberContextMetadata,
) => {
  const { abbreviate, unit, suffix: suffixType } = contextFormattingSpec;
  // NOTE(gperkins@20240607): See https://github.rbx.com/Roblox/creator-dashboard/pull/5890
  // - LegacyPercentage should go away once we migrate the ExperiencesTable to RAQIv2
  const value = unit === ChartUnit.LegacyPercentage ? givenValue / 100 : givenValue;

  const numberFormatterSpec = getNumberUnitFormatterConfig(
    value,
    contextFormattingSpec,
    isInLuobuEnvironment,
    numberContextMetadata,
  );

  let formattedNumber = abbreviate
    ? formatAbbreviatedNumber(value, locale)
    : formatNumberWithUnit(value, numberFormatterSpec, locale);

  if (suffixType && numberFormatterSpec.suffix) {
    const suffixKey = numberFormatterSpec.suffix[suffixType];
    if (suffixKey) {
      const suffix = translateIfKey(suffixKey, translate);
      // TODO: suffixKey's should be converted into TranslationKey's with embedded numbers
      formattedNumber = `${formattedNumber} ${suffix}` as FormattedText;
    }
  }

  if (numberFormatterSpec.prefix) {
    const prefix = translateIfKey(numberFormatterSpec.prefix, translate);
    formattedNumber = `${prefix}${formattedNumber}`;
  }

  return formattedNumber.toString() as FormattedText;
};

export enum NumberContext {
  // data points that require full precision. E.g. numbers in charts
  DataPoint = 'DataPoint',
  // data points that require full precision with unit suffix. E.g. numbers in tables
  TableDataPoint = 'TableDataPoint',
  // numbers displayed in chart headers
  ChartSummary = 'ChartSummary',
  // numbers displayed in tab headers. E.g. the tabbed charts on overview page
  TabSummary = 'TabSummary',
  // numbers displayed in highlight cards / tiles. E.g. experience tiles in watchlists
  CardSummary = 'CardSummary',
  // summary numbers shown in tables E.g. error reporting. This is different from data points in tables.
  TableSummary = 'TableSummary',
  // numbers shown in achievement insight headers
  AchievementHeader = 'AchievementHeader',
}

const getContextFormattingSpec = (
  numberContext: NumberContext,
  unit: ChartUnit,
  type: ChartUnitAggregationType,
): TContextFormattingSpec => {
  switch (numberContext) {
    case NumberContext.DataPoint:
      return {
        unit,
        type,
      };
    case NumberContext.TableDataPoint: {
      switch (unit) {
        case ChartUnit.Seconds:
        case ChartUnit.Minutes:
        case ChartUnit.Hours:
          return {
            unit,
            type,
            // NOTE(gperkins@ 20240415): Prioritize consistency with engagement page summary
            suffix: 'short',
          };
        default:
          return {
            unit,
            type,
          };
      }
    }
    case NumberContext.ChartSummary: {
      switch (unit) {
        case ChartUnit.Minutes:
          return {
            unit,
            type,
            suffix: 'short',
          };
        default:
          return {
            unit,
            type,
            suffix: 'long',
          };
      }
    }
    case NumberContext.TabSummary: {
      switch (unit) {
        case ChartUnit.Players: {
          return {
            unit,
            type,
          };
        }
        default:
          return {
            unit,
            type,
            suffix: 'short',
          };
      }
    }
    case NumberContext.CardSummary:
    case NumberContext.TableSummary: {
      // Don't abbreviate time and percentages
      switch (unit) {
        case ChartUnit.Percentage:
        case ChartUnit.LegacyPercentage:
        case ChartUnit.RoughPercentage:
        case ChartUnit.WholePercentage:
          return {
            unit,
            type,
          };
        case ChartUnit.Seconds:
        case ChartUnit.Minutes:
        case ChartUnit.Hours:
          return {
            unit,
            type,
            suffix: 'short',
          };
        case ChartUnit.Gigabytes:
          return {
            unit,
            type,
            suffix: 'long',
          };
        default:
          return {
            unit,
            type,
            abbreviate: true,
          };
      }
    }
    case NumberContext.AchievementHeader: {
      switch (unit) {
        case ChartUnit.Players:
          return {
            unit: ChartUnit.Unknown,
            type: ChartUnitAggregationType.Unknown,
          };
        case ChartUnit.Percentage:
          return {
            unit: ChartUnit.Percentage,
            type: ChartUnitAggregationType.Ratio,
          };
        case ChartUnit.Minutes:
          return {
            unit: ChartUnit.Minutes,
            type: ChartUnitAggregationType.Unknown,
            suffix: 'short',
          };
        default:
          return {
            unit,
            type,
            abbreviate: false,
          };
      }
    }
    default: {
      const exhaustiveCheck: never = numberContext;
      throw new Error(`Unsupported context ${exhaustiveCheck}`);
    }
  }
};

export type TNumberContextMetadata = {
  chartSpec: Pick<RAQIV2ChartSpec, 'filter'> | null;
  inRoundedComparisonChipContext?: boolean;
};

export type TFormatNumberSpec = {
  value: number;
  unit: ChartUnit;
  type: ChartUnitAggregationType;
  context: NumberContext;
  locale: Locale;
  translate: TranslationKeyToFormattedText;
  numberContextMetadata?: TNumberContextMetadata;
};

/**
 * Note: Ideally we should use formatNumberWithSpec instead. Determining how numbers are formatted is
 * now moved out of charts-generic.
 *
 * @deprecated Use formatNumberWithSpec instead.
 */
export const formatNumber = ({
  value,
  unit,
  type,
  context,
  locale,
  translate,
  numberContextMetadata,
}: TFormatNumberSpec) => {
  const contextFormattingSpec = getContextFormattingSpec(context, unit, type);
  const isInLuobuEnvironment = process.env.buildTarget === 'luobu';
  return formatNumberFromSpec(
    value,
    contextFormattingSpec,
    locale,
    translate,
    isInLuobuEnvironment,
    numberContextMetadata,
  );
};

export enum NumberIcon {
  Robux = 'Robux',
}

// NOTE(shumingxu, 2025-07-22): Following upgrade to new analyticsNumberFormatter, dynamic overrides
// should be used sparingly only for cases where:
// 1. The special override is specific to formatting the number itself (i.e. not prefix/suffix)
// 2. Does not change the overall formatting structure (e.g. special suffix, abbreviate, etc.)
// For significant changes that deviate from standard formatting, use specialNumberFormatting to branch
// off at the top level instead.
export enum NumberFormatterSpecDynamicOverrides {
  ForceTwoDecimalDigitsWhenAverageUnder100 = 'ForceTwoDecimalDigitsWhenAverageUnder100',
  PreserveSmallValuesWithSignificantDigits = 'PreserveSmallValuesWithSignificantDigits',
}

export type TFormattingSpec = {
  abbreviate: boolean;
  prefix?: TranslationKeyOrFormattedText;
  suffix?: TranslationKeyOrFormattedText;
  numberFormatOptions: Intl.NumberFormatOptions;
  icon?: NumberIcon;
  dynamicOverrides?: NumberFormatterSpecDynamicOverrides[];
  scalingFactor?: number;
};

const DynamicOverrideImplementations: Record<
  NumberFormatterSpecDynamicOverrides,
  (accSpec: TFormattingSpec, value: number) => TFormattingSpec
> = {
  [NumberFormatterSpecDynamicOverrides.ForceTwoDecimalDigitsWhenAverageUnder100]: (
    accSpec,
    value,
  ) => {
    if (value < 100) {
      return {
        ...accSpec,
        numberFormatOptions: {
          ...accSpec.numberFormatOptions,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      };
    }
    return accSpec;
  },
  [NumberFormatterSpecDynamicOverrides.PreserveSmallValuesWithSignificantDigits]: (
    accSpec,
    value,
  ) => {
    const absValue = Math.abs(value);
    const maxFractionDigits = accSpec.numberFormatOptions.maximumFractionDigits;
    if (absValue === 0 || maxFractionDigits == null) {
      return accSpec;
    }

    const roundingThreshold = 10 ** -maxFractionDigits;
    if (absValue >= roundingThreshold) {
      return accSpec;
    }

    const numberFormatOptions = Object.fromEntries(
      Object.entries(accSpec.numberFormatOptions).filter(
        ([key]) => key !== 'minimumFractionDigits' && key !== 'maximumFractionDigits',
      ),
    ) as Intl.NumberFormatOptions;
    return {
      ...accSpec,
      numberFormatOptions: {
        ...numberFormatOptions,
        minimumSignificantDigits: 2,
        maximumSignificantDigits: 3,
      },
    };
  },
};

export const formatNumberWithSpec = (
  value: number,
  baseSpec: TFormattingSpec,
  translationDependencies: {
    locale: Locale;
    translate: TranslationKeyToFormattedText;
  },
): FormattedText => {
  const { dynamicOverrides, scalingFactor } = baseSpec;
  const scaledValue = scalingFactor ? value * scalingFactor : value;
  const spec =
    dynamicOverrides?.reduce((accSpec: TFormattingSpec, override) => {
      return DynamicOverrideImplementations[override](accSpec, scaledValue);
    }, baseSpec) ?? baseSpec;

  const { abbreviate, prefix, suffix, numberFormatOptions } = spec;
  const { locale, translate } = translationDependencies;
  const prefixText = prefix ? translateIfKey(prefix, translate) : '';
  const suffixText = suffix ? ` ${translateIfKey(suffix, translate)}` : '';

  if (abbreviate) {
    const abbreviatedNumber = formatAbbreviatedNumber(scaledValue, locale);
    return `${prefixText}${abbreviatedNumber}${suffixText}` as FormattedText;
  }

  if (Math.abs(value) >= scientificNotationThreshold) {
    numberFormatOptions.notation = 'scientific';
    numberFormatOptions.maximumFractionDigits = 2;
    numberFormatOptions.minimumFractionDigits = 2;
  }

  const localizedNumberFormatter = new NumberFormatter(locale, '');
  const rawNumber = localizedNumberFormatter
    .getCustomNumber(scaledValue, numberFormatOptions)
    .toString();

  return `${prefixText}${rawNumber}${suffixText}` as FormattedText;
};
