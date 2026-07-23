import type { FormattedText } from '@modules/analytics-translations/types';
import { formatNumberWithSpec } from '@modules/charts-generic/charts/numberFormatters';
import type { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import type { TAnalyticsNumberFormatterArgs } from './analyticsNumberFormattingSpec';
import { generateAnalyticsNumberFormattingSpec } from './analyticsNumberFormattingSpec';

const formatAnalyticsNumber = (
  value: number,
  args: TAnalyticsNumberFormatterArgs,
  translationDependencies: RAQIV2TranslationDependencies,
): FormattedText => {
  const spec = generateAnalyticsNumberFormattingSpec(args);
  return formatNumberWithSpec(value, spec, translationDependencies);
};

export default formatAnalyticsNumber;
