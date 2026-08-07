import clone from 'just-clone';
import { NumberFormatter } from '@rbx/core';
import { FallbackValue } from '@rbx/creator-hub-analytics-config';
import type { Locale } from '@rbx/intl';
import type {
  FormattedText,
  TranslationKeyOrFormattedText,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations/types';
import { TranslationKeyOrFormattedTextType } from '@modules/analytics-translations/types';
import { brandUntranslatableText } from '@modules/analytics-translations/wrapperFunctions';
import type RAQIV2ChartSpec from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';

const largeValueScientificNotationThreshold = 1e12;

// Boundary where the abbreviation helper starts applying K/M/B/T suffixes.
// Below this value, abbreviation only changes precision unless bypassed.
const abbreviationSuffixThreshold = 1000;

// Number of fraction digits used when we fall back to scientific notation
// (matches the long-standing high-end fallback for `|value| >= 1e12`).
const scientificNotationFractionDigits = 2;

// Cutoff between "moderately small" values (rendered with significant digits
// to preserve precision, e.g. `0.005` -> `"0.0050"`) and "tiny" values
// (rendered in scientific notation, e.g. `0.0000744` -> `"7.44E-5"`).
const smallValueScientificNotationThreshold = 1e-3;

// Significant-digit precision used by both small-value fallback tiers.
const smallValueMaxSignificantDigits = 3;

// Rendered when a non-finite value (NaN, +/-Infinity) reaches the formatter.
const NON_FINITE_PLACEHOLDER = brandUntranslatableText('--');

const fallbackNoDataSeriesValueConfig: Record<FallbackValue, string | number> = {
  [FallbackValue.Invalid]: 'N/A',
  [FallbackValue.NA]: 'N/A',
  [FallbackValue.Zero]: 0,
};

export const getFallbackNoDataSeriesValue = (noDataFallback: FallbackValue) => {
  return fallbackNoDataSeriesValueConfig[noDataFallback];
};

export const formatAbbreviatedNumber = (value: number, locale: Locale): string => {
  // Guard non-finite inputs so we don't render `"NaN"` or `"∞T"`.
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

  return `${localizedNumberFormatter.getCustomNumber(quotient, {
    style: 'decimal',
    minimumFractionDigits: abbreviation === '' ? 0 : 1,
    maximumFractionDigits: 1,
  })}${abbreviation}`;
};

/**
 * Detects non-zero fractional values where the effective max-fraction-digits
 * of the path that will actually render the value cannot preserve enough
 * significant digits. Used to fall back to a higher-precision representation.
 */
const shouldFallBackToSmallValueScientificNotation = (
  value: number,
  numberFormatOptions: Intl.NumberFormatOptions,
  effectiveMaxFractionDigits: number | undefined,
): boolean => {
  if (!Number.isFinite(value) || value === 0) {
    return false;
  }

  const { style, notation, minimumSignificantDigits, maximumSignificantDigits } =
    numberFormatOptions;
  if (style === 'percent' || style === 'currency') {
    return false;
  }

  if (notation === 'scientific' || notation === 'engineering') {
    return false;
  }

  if (minimumSignificantDigits != null || maximumSignificantDigits != null) {
    return Math.abs(value) < smallValueScientificNotationThreshold;
  }

  if (effectiveMaxFractionDigits == null || effectiveMaxFractionDigits === 0) {
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

export enum NumberContext {
  DataPoint = 'DataPoint',
  TableDataPoint = 'TableDataPoint',
  ChartSummary = 'ChartSummary',
  TabSummary = 'TabSummary',
  CardSummary = 'CardSummary',
  TableSummary = 'TableSummary',
  AchievementHeader = 'AchievementHeader',
}

export type TNumberContextMetadata = {
  chartSpec: Pick<RAQIV2ChartSpec, 'filter'> | null;
  inRoundedComparisonChipContext?: boolean;
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

const translateIfKey = (
  key: TranslationKeyOrFormattedText,
  translate: TranslationKeyToFormattedText,
) => {
  return key.type === TranslationKeyOrFormattedTextType.PredefinedTranslationKey
    ? translate(key.key)
    : key.text;
};

export const formatNumberWithSpec = (
  value: number,
  baseSpec: TFormattingSpec,
  translationDependencies: {
    locale: Locale;
    translate: TranslationKeyToFormattedText;
  },
): FormattedText => {
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

  let effectiveNumberFormatOptions = clone(numberFormatOptions);
  if (Math.abs(scaledValue) >= largeValueScientificNotationThreshold) {
    effectiveNumberFormatOptions.notation = 'scientific';
    effectiveNumberFormatOptions.maximumFractionDigits = scientificNotationFractionDigits;
    effectiveNumberFormatOptions.minimumFractionDigits = scientificNotationFractionDigits;
  } else if (useSmallValueScientificFallback) {
    const {
      minimumFractionDigits: _minFractionDigits,
      maximumFractionDigits: _maxFractionDigits,
      ...specWithoutFractionDigits
    } = effectiveNumberFormatOptions;
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
