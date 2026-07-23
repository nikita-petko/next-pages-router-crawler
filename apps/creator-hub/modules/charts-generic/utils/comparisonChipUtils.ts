import type { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type {
  TranslationKeyToFormattedText,
  FormattedText,
} from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ComparisonChipSpec } from '../charts/ComparisonChip';
import type { TNumberContextMetadata } from '../charts/numberFormatters';
import {
  millisecondsInInterval,
  shouldAlignComparisonSeriesEndWithMainSeriesStart,
} from './granularityUtils';
export const getComparisonChipTooltip = ({
  translate,
  startDate,
  endDate,
  comparisonStartDate,
  comparisonEndDate,
}: {
  translate: TranslationKeyToFormattedText;
  startDate: Date;
  endDate?: Date;
  comparisonStartDate: Date;
  comparisonEndDate?: Date;
}): FormattedText => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  return translate(translationKey('Tooltip.PeriodComparison', TranslationNamespace.Analytics), {
    currentPeriod: endDate
      ? `${formatter.format(startDate)} - ${formatter.format(endDate)}`
      : formatter.format(startDate),
    previousPeriod: comparisonEndDate
      ? `${formatter.format(comparisonStartDate)} - ${formatter.format(comparisonEndDate)}`
      : formatter.format(comparisonStartDate),
  });
};

export enum comparisonTimeRangeOffset {
  useOffsetForInclusiveDateRange = 'useOffsetForInclusiveDateRange',
  disableOffsetForExclusiveDateRange = 'disableOffsetForExclusiveDateRange',
}

export const getComparisonTimeRange = (
  startDate: Date,
  endDate: Date,
  granularity: RAQIV2MetricGranularity,
  offsetForInclusiveDateRange?: comparisonTimeRangeOffset,
): { comparisonStartDate: Date; comparisonEndDate: Date } => {
  const duration = endDate.getTime() - startDate.getTime();
  const offsetType =
    offsetForInclusiveDateRange ??
    (shouldAlignComparisonSeriesEndWithMainSeriesStart(granularity)
      ? comparisonTimeRangeOffset.disableOffsetForExclusiveDateRange
      : comparisonTimeRangeOffset.useOffsetForInclusiveDateRange);
  const offset =
    offsetType === comparisonTimeRangeOffset.useOffsetForInclusiveDateRange
      ? millisecondsInInterval(granularity)
      : 0;
  const comparisonEndDate = new Date(startDate.getTime() - offset);
  return {
    comparisonStartDate: new Date(comparisonEndDate.getTime() - duration),
    comparisonEndDate,
  };
};

export const getComparisonChipSpec = ({
  isPositiveGood,
  current,
  previous,
  tooltip,
  hasBackground,
  useWarningBackgroundWhenNotGood,
  numberContextMetadata,
  dimmedLabel,
  maximumDecimals,
}: {
  isPositiveGood: boolean;
  current: number | null;
  previous: number | null;
  tooltip?: FormattedText;
  hasBackground?: boolean;
  useWarningBackgroundWhenNotGood?: boolean;
  numberContextMetadata?: TNumberContextMetadata;
  dimmedLabel?: boolean;
  maximumDecimals?: number;
}): ComparisonChipSpec | undefined => {
  if (!previous || !current) {
    return undefined;
  }

  const percentage = Math.abs((current - previous) / previous);
  const isUp = current > previous;
  const isGood = isPositiveGood ? isUp : !isUp;

  return {
    percentage,
    isUp,
    isGood,
    tooltip,
    hasBackground,
    numberContextMetadata,
    dimmedLabel,
    maximumDecimals,
    useWarningBackgroundWhenNotGood,
  };
};
