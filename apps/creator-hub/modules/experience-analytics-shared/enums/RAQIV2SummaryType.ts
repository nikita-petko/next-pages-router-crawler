import type { TranslationKey } from '@modules/analytics-translations/types';
import ChartSummaryType from '@modules/charts-generic/enums/ChartSummaryType';
import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';

type TranslationMetaData = {
  translationKey: TranslationKey;
  arguments?: Record<string, string>;
};

const RAQIV2DoubleMetricSummaryType = [ChartSummaryType.QuotaPercentageUsage] as const; // could have other types in the future
type TRAQIV2DoubleMetricSummaryType = (typeof RAQIV2DoubleMetricSummaryType)[number];

const RAQIV2AggregatedBreakdownSummaryType = [ChartSummaryType.TopBreakdown] as const; // could have other types in the future
type TRAQIV2AggregatedBreakdownSummaryType = (typeof RAQIV2AggregatedBreakdownSummaryType)[number];

export type RAQIV2CompoundDoubleMetricSummaryType = {
  type: TRAQIV2DoubleMetricSummaryType;
  specificLabel?: TranslationMetaData;
};

export type RAQIV2CompoundAggregatedBreakdownSummaryType = {
  type: TRAQIV2AggregatedBreakdownSummaryType;
  specificLabel?: TranslationMetaData;
};

export type RAQIV2CompoundSingleMetricSummaryType =
  | {
      type: Exclude<
        ChartSummaryType,
        | ChartSummaryType.SinglePoint
        | ChartSummaryType.QuotaPercentageUsage
        | ChartSummaryType.TopBreakdown
      >;
      specificLabel?: TranslationMetaData;
    }
  | {
      type: ChartSummaryType.SinglePoint;
      selectedXValue: number;
      specificLabel?: TranslationMetaData;
    };

export type RAQIV2CompoundSummaryType =
  | RAQIV2CompoundDoubleMetricSummaryType
  | RAQIV2CompoundSingleMetricSummaryType;

export const isRAQIV2DoubleMetricSummaryType = (
  type: RAQIV2CompoundSummaryType,
): type is RAQIV2CompoundDoubleMetricSummaryType => {
  return isValidArrayEnumValue(RAQIV2DoubleMetricSummaryType, type.type);
};

export const isRAQIV2AggregatedBreakdownSummaryType = (
  type: RAQIV2CompoundAggregatedBreakdownSummaryType,
): type is RAQIV2CompoundAggregatedBreakdownSummaryType => {
  return isValidArrayEnumValue(RAQIV2AggregatedBreakdownSummaryType, type.type);
};

export const isRAQIV2SingleMetricSummaryType = (
  type: RAQIV2CompoundSummaryType,
): type is RAQIV2CompoundSingleMetricSummaryType => {
  return !isRAQIV2DoubleMetricSummaryType(type);
};

// NOTE(shumingxu, 07/15/2025): Keep this for backward compatibility
export const RAQIV2SummaryType = ChartSummaryType;

export default ChartSummaryType;
