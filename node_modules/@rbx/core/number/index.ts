import localizeNumberString from '../numberFormatter';
import suffixNames from './suffixNames';

const ONE_THOUSAND = 1000;
const ONE_MILLION = 1000000;

const suffixes = {
  withPlus: ['', 'K+', 'M+', 'B+', 'T+'],
  withoutPlus: ['', 'K', 'M', 'B', 'T'],
};

export function getFormattedNumber(value: number): string {
  return String(value);
}

// Used in creator dashboard devex
export function getAbbreviatedNumber(value: number) {
  if (value > ONE_MILLION) {
    return `${Math.trunc(value / ONE_MILLION)}M`;
  }
  return String(value);
}

/*
 * Abbreviate number into at most 4 digits, such as 567 => 567, 1,120 => 1.1K, 33,890,133 => 33.9M
 * when isFormatEnabledUnderThreshold is true, means we will do only number format for the input instead of abbreviation
 */
export function getPrettifiedNumber(
  value: number,
  suffixType?: suffixNames,
  abbreviationThreshold?: number,
  isFormatEnabledUnderThreshold?: boolean,
) {
  let newValue = `${Math.round(value)}`;
  if (abbreviationThreshold && value < abbreviationThreshold) {
    return isFormatEnabledUnderThreshold ? localizeNumberString(value) : newValue;
  }
  const suffix = suffixType ? suffixes[suffixType] : suffixes[suffixNames.withoutPlus];
  const maxSuffixNum = Math.ceil(newValue.length / 3);
  const maxDecPlaces = ONE_THOUSAND ** maxSuffixNum;
  const maxShortValue = Math.round((value / maxDecPlaces) * 10) / 10;

  const minSuffixNum = maxSuffixNum - 1;
  const minDecPlaces = ONE_THOUSAND ** minSuffixNum;
  const minShortValue = Math.round((value / minDecPlaces) * 10) / 10;

  if (minShortValue >= ONE_THOUSAND) {
    newValue = maxShortValue + suffix[maxSuffixNum];
  } else {
    newValue = minShortValue + suffix[minSuffixNum];
  }
  return newValue;
}

export default {
  getFormattedNumber,
  getAbbreviatedNumber,
  getPrettifiedNumber,
  suffixNames,
};
