import type AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { FormattedText } from '@modules/analytics-translations/types';
import type { TCardStyleConfig } from '@modules/charts-generic/types/CardStyleConfig';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import type { RAQIV2CompoundSingleMetricSummaryType } from '../enums/RAQIV2SummaryType';
import type { GenericRAQIV2SummaryLabel, ItemMetadata } from '../types/RAQIV2SummaryCardShared';
import type { SpecOverride } from '../utils/computeRAQIV2SpecOverride';
import type { TRAQIV2NumericUIMetric } from './AnalyticsMetricDisplayConfig';
import RAQIV2SummaryCardType from './RAQIV2SummaryCardType';

const genericRAQIV2SummaryCardStyle: TCardStyleConfig = {
  loadingBodyHeight: 99,
  loadingBodyWidth: 180,
};

export const RAQIV2SummaryCardStyle: Record<RAQIV2SummaryCardType, TCardStyleConfig> = {
  [RAQIV2SummaryCardType.Item]: genericRAQIV2SummaryCardStyle,
  [RAQIV2SummaryCardType.Metric]: genericRAQIV2SummaryCardStyle,
  [RAQIV2SummaryCardType.TopBreakdown]: genericRAQIV2SummaryCardStyle,
};

export type AnalyticsSummaryCardConfig = {
  type: AnalyticsComponentType.SummaryCard;
  summaryKey?: string; // previously RAQIV2PredefinedSummaryCardKey, only used for logging
  cardType: RAQIV2SummaryCardType;
  getItemMetadata?: (breakdown: RAQIV2BreakdownValue[]) => Promise<ItemMetadata>;
  metric: TRAQIV2NumericUIMetric;
  summaryType: RAQIV2CompoundSingleMetricSummaryType;
  overrides: SpecOverride;
  label?: GenericRAQIV2SummaryLabel;
  labelText?: FormattedText;
  fullWidth?: boolean;
  /**
   * When true, the summary card renders a comparison chip (e.g. ↑ 2.4%) next
   * to the value, similar to chart summaries. Opt-in to avoid issuing extra
   * comparison requests for cards that don't need it. Currently only honored
   * by `RAQIV2SummaryCardType.Metric` cards.
   */
  showComparisonChip?: boolean;
} & (
  | {
      cardType: RAQIV2SummaryCardType.Item;
      getItemMetadata: (breakdown: RAQIV2BreakdownValue[]) => Promise<ItemMetadata>;
    }
  | {
      cardType: Exclude<RAQIV2SummaryCardType, RAQIV2SummaryCardType.Item>;
      getItemMetadata?: undefined;
    }
);
