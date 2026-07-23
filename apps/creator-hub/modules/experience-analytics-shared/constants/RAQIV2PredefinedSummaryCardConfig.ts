import { TCardStyleConfig } from '@modules/charts-generic';
import { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { SpecOverride } from '../utils/computeRAQIV2SpecOverride';
import type { GenericRAQIV2SummaryLabel } from '../components/RAQIV2/summaryCards/GenericRAQIV2MetricSummaryCard';
import type { TRAQIV2NumericUIMetric } from './AnalyticsMetricDisplayConfig';
import { RAQIV2CompoundSingleMetricSummaryType } from '../enums/RAQIV2SummaryType';
import RAQIV2SummaryCardType from './RAQIV2SummaryCardType';
import { ItemMetadata } from '../components/RAQIV2/summaryCards/GenericRAQIV2ItemSummaryCard';

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
  fullWidth?: boolean;
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
