import type { TranslationKeyOrFormattedText } from '@modules/analytics-translations/types';

export enum NumberIcon {
  Robux = 'Robux',
}

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
