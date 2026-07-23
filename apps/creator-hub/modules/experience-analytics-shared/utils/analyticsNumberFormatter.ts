import { formatNumberWithSpec } from '@modules/charts-generic';
import { FormattedText } from '@modules/analytics-translations';
import {
  generateAnalyticsNumberFormattingSpec,
  TAnalyticsNumberFormatterArgs,
} from './analyticsNumberFormattingSpec';
import { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';

const formatAnalyticsNumber = (
  value: number,
  args: TAnalyticsNumberFormatterArgs,
  translationDependencies: RAQIV2TranslationDependencies,
): FormattedText => {
  const spec = generateAnalyticsNumberFormattingSpec(args);
  return formatNumberWithSpec(value, spec, translationDependencies);
};

export default formatAnalyticsNumber;
