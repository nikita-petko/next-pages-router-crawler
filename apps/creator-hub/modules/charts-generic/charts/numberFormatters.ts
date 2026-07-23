import { NumberFormatter } from '@rbx/core';
import { FallbackValue, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { Locale } from '@rbx/intl';
import {
  type FormattedText,
  type TranslationKeyOrFormattedText,
  type TranslationKeyToFormattedText,
  TranslationKeyOrFormattedTextType,
} from '@modules/analytics-translations/types';
import {
  brandUntranslatableText,
  translationKey,
} from '@modules/analytics-translations/wrapperFunctions';
import type RAQIV2ChartSpec from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ChartUnit, ChartUnitAggregationType } from './types/ChartTypes';
import { NumberFormatterSpecDynamicOverrides, type TFormattingSpec } from './types/FormattingSpec';

export {
  NumberIcon,
  NumberFormatterSpecDynamicOverrides,
  type TFormattingSpec,
} from './types/FormattingSpec';

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

const largeValueScientificNotationThreshold = 1e12;

// Boundary where the abbreviation helper starts applying K/M/B/T suffixes.
// Below this value, abbreviation only changes precision unless bypassed.
const abbreviationSuffixThreshold = 1000;

// Number of fraction digits used when we fall back to scientific notation
// (matches the long-standing high-end fallback for `|value| >= 1e12`).
const scientificNotationFractionDigits = 2;

// Cutoff between "moderately small" values (rendered with significant digits
// to preserve precision — e.g. `0.005` → `"0.0050"`) and "tiny" values
// (rendered in scientific notation — e.g. `0.0000744` → `"7.44E-5"`). Values
// at or above this magnitude prefer sig-digits because `formatAbbreviatedNumber`
// + Intl produces a clean decimal; below this magnitude scientific is more
// readable than a long string of leading zeros.
const smallValueScientificNotationThreshold = 1e-3;

// Significant-digit precision used by both small-value fallback tiers.
// This preserves values like `0.0795` / `0.00795` without forcing noisy trailing
// zeros on exact values like `0.001`.
const smallValueMaxSignificantDigits = 3;

// Rendered when a non-finite value (NaN, +/-Infinity) reaches the formatter.
// Mirrors the literal exported as `noDataSymbol` from
// `components/MetricValue/MetricValue.tsx`; kept inline so this low-level
// utility doesn't reach up into the component layer.
const NON_FINITE_PLACEHOLDER = brandUntranslatableText('--');

/**
 * Detects non-zero fractional values where the effective max-fraction-digits
 * of the path that will actually render the value cannot preserve enough
 * significant digits. Used to fall back to a higher-precision representation
 * (sig-digits or scientific notation, depending on magnitude) so non-integer
 * metrics don't collapse or over-round (`0.00795` -> `0.008`,
 * `0.000795` -> `0.001`).
 *
 * The fallback intentionally does **not** fire for two cases that already
 * render the value as faithfully as the spec author intended:
 *
 *   1. `effectiveMaxFractionDigits === 0` — integer specs (`Players`, OOM
 *      exits, etc.) deliberately quantize to whole numbers. Surfacing
 *      sub-integer noise like `4.90E-1` for `0.49` average OOM exits would
 *      defeat the spec's contract; honor it and let those values round to
 *      `'0'` or `'1'` (CREATORBUG-23911).
 *   2. The spec already includes `minimumSignificantDigits` /
 *      `maximumSignificantDigits` and the value is at least `1e-3` (axis
 *      specs, or values that have already gone through the
 *      `PreserveSmallValuesWithSignificantDigits` override). Sig-digit specs
 *      preserve moderate small-value precision through Intl natively, so an
 *      extra fallback would be redundant. They still use scientific notation
 *      below `1e-3` so the axis follows the same tiny-value rule as summaries.
 *
 * `effectiveMaxFractionDigits` is caller-supplied because the abbreviate path
 * (`formatAbbreviatedNumber`) renders sub-1000 values with a fixed
 * `maxFractionDigits: 1`, regardless of what the spec's
 * `numberFormatOptions.maximumFractionDigits` says. Using the spec's value for
 * the abbreviate path over-triggered the fallback for visible values like
 * `0.5` in summary cards (CREATORBUG-23911).
 *
 * For fraction-digit specs, count the leading zeros after the decimal point to
 * determine how many significant digits `maximumFractionDigits` can actually
 * display. With `maxFrac: 3`, `0.795` can show three sig digits and stays as
 * `0.795`, but `0.0795` can show only two (`0.079`) and `0.00795` can show
 * only one (`0.008`), so both use the sig-digit fallback.
 *
 * Uses standard math (no string parsing) so locale-formatted output never
 * influences the decision.
 */
const shouldFallBackToSmallValueScientificNotation = (
  value: number,
  numberFormatOptions: Intl.NumberFormatOptions,
  effectiveMaxFractionDigits: number | undefined,
): boolean => {
  if (!Number.isFinite(value) || value === 0) {
    return false;
  }
  // Percent / currency styles already render meaningfully near zero (e.g. `0%`,
  // `$0.00`) and have their own product-defined precision contract. Skip them.
  const { style, notation, minimumSignificantDigits, maximumSignificantDigits } =
    numberFormatOptions;
  if (style === 'percent' || style === 'currency') {
    return false;
  }
  // `scientific` and `engineering` already render exponentially and never
  // collapse to `'0'` for tiny values, so leave them alone. Other notations
  // (notably `compact` — used by Y-axis specs to abbreviate `200000` as
  // `200K`) DO round tiny values to `'0'`, so they still need the fallback.
  if (notation === 'scientific' || notation === 'engineering') {
    return false;
  }
  if (minimumSignificantDigits != null || maximumSignificantDigits != null) {
    return Math.abs(value) < smallValueScientificNotationThreshold;
  }
  if (effectiveMaxFractionDigits == null) {
    return false;
  }
  if (effectiveMaxFractionDigits === 0) {
    return false;
  }
  const absValue = Math.abs(value);
  if (absValue >= 1) {
    return false;
  }
  if (absValue < smallValueScientificNotationThreshold) {
    return true;
  }
  const leadingFractionZeroCount = Math.max(0, Math.ceil(-Math.log10(absValue)) - 1);
  const visibleSignificantDigits = effectiveMaxFractionDigits - leadingFractionZeroCount;
  return visibleSignificantDigits < smallValueMaxSignificantDigits;
};

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

  if (Math.abs(roundValueIfNeeded) >= largeValueScientificNotationThreshold) {
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
  // Guard non-finite inputs so we don't render `"NaN"` or `"∞T"`
  // (the threshold comparisons happily concatenate `"T"` onto `Infinity`).
  if (!Number.isFinite(value)) {
    return NON_FINITE_PLACEHOLDER;
  }
  const localizedNumberFormatter = new NumberFormatter(locale, '');
  const abbreviations = {
    thousand: {
      threshold: abbreviationSuffixThreshold,
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
    return brandUntranslatableText(currencyFilterValue[0]);
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

  if (!baseConfig.dynamicOverrides) {
    return baseConfig;
  }

  const resolvedConfig: TNumberFormatSpec = { ...baseConfig };
  for (const override of baseConfig.dynamicOverrides) {
    switch (override) {
      case NumberFormatterDynamicOverrides.ForceTwoDecimalDigitsWhenRatio:
        if (
          contextFormattingSpec.type === ChartUnitAggregationType.Ratio ||
          contextFormattingSpec.type === ChartUnitAggregationType.AverageRatio
        ) {
          Object.assign(resolvedConfig, twoDecimalFormattingConfig);
        }
        break;
      case NumberFormatterDynamicOverrides.ForceTwoDecimalDigitsWhenAverageUnder100:
        if (contextFormattingSpec.type === ChartUnitAggregationType.Average && value < 100) {
          Object.assign(resolvedConfig, twoDecimalFormattingConfig);
        }
        break;
      case NumberFormatterDynamicOverrides.UseMetadataCurrencyName: {
        const currencyName = getCurrencyNameFromChartSpec(numberContextMetadata?.chartSpec ?? null);
        if (currencyName) {
          resolvedConfig.suffix = {
            long: {
              type: TranslationKeyOrFormattedTextType.DynamicFormattedText,
              text: currencyName,
            },
            short: {
              type: TranslationKeyOrFormattedTextType.DynamicFormattedText,
              text: currencyName,
            },
          };
        }
        break;
      }
      case NumberFormatterDynamicOverrides.UseChineseYuanSymbolIfLuobu:
        if (isInLuobuEnvironment) {
          resolvedConfig.prefix = {
            type: TranslationKeyOrFormattedTextType.DynamicFormattedText,
            text: brandUntranslatableText('¥'),
          };
        }
        break;
    }
  }

  return resolvedConfig;
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

  let formattedNumber: string = abbreviate
    ? formatAbbreviatedNumber(value, locale)
    : formatNumberWithUnit(value, numberFormatterSpec, locale);

  if (suffixType && numberFormatterSpec.suffix) {
    const suffixKey = numberFormatterSpec.suffix[suffixType];
    if (suffixKey) {
      const suffix = translateIfKey(suffixKey, translate);
      // TODO: suffixKey's should be converted into TranslationKey's with embedded numbers
      formattedNumber = `${formattedNumber} ${suffix}`;
    }
  }

  if (numberFormatterSpec.prefix) {
    const prefix = translateIfKey(numberFormatterSpec.prefix, translate);
    formattedNumber = `${prefix}${formattedNumber}`;
  }

  return brandUntranslatableText(formattedNumber);
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
        case ChartUnit.Robux:
        case ChartUnit.Percentage:
        case ChartUnit.Players:
        case ChartUnit.Sessions:
        case ChartUnit.Days:
        case ChartUnit.Milliseconds:
        case ChartUnit.Impressions:
        case ChartUnit.Teleports:
        case ChartUnit.VideoViews:
        case ChartUnit.RequestUnits:
        case ChartUnit.Requests:
        case ChartUnit.Bytes:
        case ChartUnit.KiloBytes:
        case ChartUnit.MegaBytes:
        case ChartUnit.Gigabytes:
        case ChartUnit.FramesPerSecond:
        case ChartUnit.Unknown:
        case ChartUnit.Results:
        case ChartUnit.Score:
        case ChartUnit.Sales:
        case ChartUnit.Cancellations:
        case ChartUnit.Items:
        case ChartUnit.Currency:
        case ChartUnit.Cores:
        case ChartUnit.RoughPercentage:
        case ChartUnit.WholePercentage:
        case ChartUnit.InExperienceCurrency:
        case ChartUnit.LegacyPercentage:
          return {
            unit,
            type,
          };
      }
      throw new Error('Unsupported chart unit');
    }
    case NumberContext.ChartSummary: {
      switch (unit) {
        case ChartUnit.Minutes:
          return {
            unit,
            type,
            suffix: 'short',
          };
        case ChartUnit.Robux:
        case ChartUnit.Percentage:
        case ChartUnit.Players:
        case ChartUnit.Sessions:
        case ChartUnit.Days:
        case ChartUnit.Hours:
        case ChartUnit.Seconds:
        case ChartUnit.Milliseconds:
        case ChartUnit.Impressions:
        case ChartUnit.Teleports:
        case ChartUnit.VideoViews:
        case ChartUnit.RequestUnits:
        case ChartUnit.Requests:
        case ChartUnit.Bytes:
        case ChartUnit.KiloBytes:
        case ChartUnit.MegaBytes:
        case ChartUnit.Gigabytes:
        case ChartUnit.FramesPerSecond:
        case ChartUnit.Unknown:
        case ChartUnit.Results:
        case ChartUnit.Score:
        case ChartUnit.Sales:
        case ChartUnit.Cancellations:
        case ChartUnit.Items:
        case ChartUnit.Currency:
        case ChartUnit.Cores:
        case ChartUnit.RoughPercentage:
        case ChartUnit.WholePercentage:
        case ChartUnit.InExperienceCurrency:
        case ChartUnit.LegacyPercentage:
          return {
            unit,
            type,
            suffix: 'long',
          };
      }
      throw new Error('Unsupported chart unit');
    }
    case NumberContext.TabSummary: {
      switch (unit) {
        case ChartUnit.Players: {
          return {
            unit,
            type,
          };
        }
        case ChartUnit.Robux:
        case ChartUnit.Percentage:
        case ChartUnit.Sessions:
        case ChartUnit.Days:
        case ChartUnit.Hours:
        case ChartUnit.Minutes:
        case ChartUnit.Seconds:
        case ChartUnit.Milliseconds:
        case ChartUnit.Impressions:
        case ChartUnit.Teleports:
        case ChartUnit.VideoViews:
        case ChartUnit.RequestUnits:
        case ChartUnit.Requests:
        case ChartUnit.Bytes:
        case ChartUnit.KiloBytes:
        case ChartUnit.MegaBytes:
        case ChartUnit.Gigabytes:
        case ChartUnit.FramesPerSecond:
        case ChartUnit.Unknown:
        case ChartUnit.Results:
        case ChartUnit.Score:
        case ChartUnit.Sales:
        case ChartUnit.Cancellations:
        case ChartUnit.Items:
        case ChartUnit.Currency:
        case ChartUnit.Cores:
        case ChartUnit.RoughPercentage:
        case ChartUnit.WholePercentage:
        case ChartUnit.InExperienceCurrency:
        case ChartUnit.LegacyPercentage:
          return {
            unit,
            type,
            suffix: 'short',
          };
      }
      throw new Error('Unsupported chart unit');
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
        case ChartUnit.Robux:
        case ChartUnit.Players:
        case ChartUnit.Sessions:
        case ChartUnit.Days:
        case ChartUnit.Milliseconds:
        case ChartUnit.Impressions:
        case ChartUnit.Teleports:
        case ChartUnit.VideoViews:
        case ChartUnit.RequestUnits:
        case ChartUnit.Requests:
        case ChartUnit.Bytes:
        case ChartUnit.KiloBytes:
        case ChartUnit.MegaBytes:
        case ChartUnit.FramesPerSecond:
        case ChartUnit.Unknown:
        case ChartUnit.Results:
        case ChartUnit.Score:
        case ChartUnit.Sales:
        case ChartUnit.Cancellations:
        case ChartUnit.Items:
        case ChartUnit.Currency:
        case ChartUnit.Cores:
        case ChartUnit.InExperienceCurrency:
          return {
            unit,
            type,
            abbreviate: true,
          };
      }
      throw new Error('Unsupported chart unit');
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
        case ChartUnit.Robux:
        case ChartUnit.Sessions:
        case ChartUnit.Days:
        case ChartUnit.Hours:
        case ChartUnit.Seconds:
        case ChartUnit.Milliseconds:
        case ChartUnit.Impressions:
        case ChartUnit.Teleports:
        case ChartUnit.VideoViews:
        case ChartUnit.RequestUnits:
        case ChartUnit.Requests:
        case ChartUnit.Bytes:
        case ChartUnit.KiloBytes:
        case ChartUnit.MegaBytes:
        case ChartUnit.Gigabytes:
        case ChartUnit.FramesPerSecond:
        case ChartUnit.Unknown:
        case ChartUnit.Results:
        case ChartUnit.Score:
        case ChartUnit.Sales:
        case ChartUnit.Cancellations:
        case ChartUnit.Items:
        case ChartUnit.Currency:
        case ChartUnit.Cores:
        case ChartUnit.RoughPercentage:
        case ChartUnit.WholePercentage:
        case ChartUnit.InExperienceCurrency:
        case ChartUnit.LegacyPercentage:
          return {
            unit,
            type,
            abbreviate: false,
          };
      }
      throw new Error('Unsupported chart unit');
    }
    default: {
      const exhaustiveCheck: never = numberContext;
      throw new Error(`Unsupported context ${String(exhaustiveCheck)}`);
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
  // Non-finite values short-circuit before any spec resolution. Without this
  // guard `Intl.NumberFormat` would render `'NaN'` / `'∞'` literally, and
  // the abbreviate path would even append a magnitude suffix (`'∞T'`).
  if (!Number.isFinite(value)) {
    return NON_FINITE_PLACEHOLDER;
  }
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

  const isIntegerSpec =
    numberFormatOptions.maximumFractionDigits === 0 &&
    (numberFormatOptions.minimumFractionDigits ?? 0) === 0;
  const shouldUseAbbreviatedNumber =
    abbreviate && !(isIntegerSpec && Math.abs(scaledValue) < abbreviationSuffixThreshold);

  // The small-value scientific-notation fallback (DSA-5725) is checked first
  // so it pre-empts the `abbreviate` path: `formatAbbreviatedNumber` rounds
  // tiny values to `'0'` for the same reason fixed-fraction formatting does.
  // Computed via standard math, not string parsing.
  //
  // The effective max-fraction-digits is path-dependent: when the abbreviate
  // helper will actually render the value, sub-1000 values use a fixed
  // `maxFractionDigits: 1` regardless of the spec. Integer specs are the
  // exception: count-style summaries (`maxFrac: 0`) must honor whole-number
  // rounding even when the summary context asks for abbreviation, so they
  // bypass the abbreviate helper below 1000.
  const effectiveMaxFractionDigits = shouldUseAbbreviatedNumber
    ? 1
    : numberFormatOptions.maximumFractionDigits;
  const useSmallValueScientificFallback = shouldFallBackToSmallValueScientificNotation(
    scaledValue,
    numberFormatOptions,
    effectiveMaxFractionDigits,
  );

  if (shouldUseAbbreviatedNumber && !useSmallValueScientificFallback) {
    const abbreviatedNumber = formatAbbreviatedNumber(scaledValue, locale);
    return brandUntranslatableText(`${prefixText}${abbreviatedNumber}${suffixText}`);
  }

  // Compute the effective format options without mutating the spec — the same
  // spec object is reused across many calls (axis ticks, tooltips, summaries),
  // so an in-place mutation here would leak into unrelated values.
  let effectiveNumberFormatOptions: Intl.NumberFormatOptions = numberFormatOptions;
  // Use the *scaled* value here (the magnitude the user actually sees), not
  // the raw `value`. A metric with `scalingFactor: 0.001` and raw value
  // `2e12` has a displayed magnitude of `2e9` — well below the scientific
  // threshold — and should render as `"2,000,000,000"` (or `"2B"`
  // abbreviated), not `"2.00E12"`.
  if (Math.abs(scaledValue) >= largeValueScientificNotationThreshold) {
    effectiveNumberFormatOptions = {
      ...numberFormatOptions,
      notation: 'scientific',
      minimumFractionDigits: scientificNotationFractionDigits,
      maximumFractionDigits: scientificNotationFractionDigits,
    };
  } else if (useSmallValueScientificFallback) {
    // Tiered small-value fallback: when the spec's max-fraction-digits would
    // hide meaningful precision (`0.00795` -> `0.008`, `0.000795` -> `0.001`),
    // fall back to a sig-digit representation that preserves the metric's
    // precision.
    //
    //   - `|scaledValue| >= 1e-3` → plain sig-digits (e.g. `0.0050`,
    //     `0.0030`). For "moderately small" values a leading-zero decimal
    //     is more readable than scientific.
    //   - `|scaledValue| < 1e-3`  → scientific + sig-digits (e.g. `7.44E-5`).
    //     Below this magnitude a plain decimal ("0.0000744") is dominated
    //     by leading zeros; scientific is the only readable representation.
    //
    // We strip the spec's fraction-digit constraints so they don't conflict
    // with sig digits: when both are set, `Intl.NumberFormat` lets fraction
    // digits override (the very behavior we're trying to escape). Other
    // spec keys (style, currency, notation set by the caller) are preserved
    // for the sig-digit tier. The tiny tier intentionally overrides notation
    // to scientific so axes and summaries follow the same `<1e-3` rule.
    const {
      minimumFractionDigits: _minFractionDigits,
      maximumFractionDigits: _maxFractionDigits,
      ...specWithoutFractionDigits
    } = numberFormatOptions;
    const isTinyValue = Math.abs(scaledValue) < smallValueScientificNotationThreshold;
    effectiveNumberFormatOptions = {
      ...specWithoutFractionDigits,
      ...(isTinyValue ? { notation: 'scientific' as const } : {}),
      maximumSignificantDigits: smallValueMaxSignificantDigits,
    };
  }

  const localizedNumberFormatter = new NumberFormatter(locale, '');
  const rawNumber = localizedNumberFormatter
    .getCustomNumber(scaledValue, effectiveNumberFormatOptions)
    .toString();

  return brandUntranslatableText(`${prefixText}${rawNumber}${suffixText}`);
};
