import {
  RAQIV2Metric,
  RAQIV2PercentileType,
  RAQIV2UIMetric,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { RAQIV2CompoundSummaryType } from '../enums/RAQIV2SummaryType';
import RAQIV2SummaryType from '../enums/RAQIV2SummaryType';
import type { SpecOverride } from '../utils/computeRAQIV2SpecOverride';
import type { TRAQIV2NumericUIMetric } from './AnalyticsMetricDisplayConfig';

export enum RAQIV2PredefinedSummaryItemKey {
  PerformanceSessionTime = 'PerformanceSessionTime',
  PerformanceClientCrashRate = 'PerformanceClientCrashRate',
  PerformanceServerMemoryUsage = 'PerformanceServerMemoryUsage',
  PerformancePeakConcurrentPlayers = 'PerformancePeakConcurrentPlayers',
  PerformanceClientFps = 'PerformanceClientFps',
}

type Config = {
  metric: TRAQIV2NumericUIMetric;
  totalSummaryType: RAQIV2CompoundSummaryType;
  overrides: Omit<SpecOverride, 'breakdown'>;
  labelKey?: TranslationKey;
};

const RAQIV2PredefinedSummaryItemConfig: Record<RAQIV2PredefinedSummaryItemKey, Config> = {
  [RAQIV2PredefinedSummaryItemKey.PerformanceSessionTime]: {
    labelKey: translationKey('Title.PerformanceSessionTime', TranslationNamespace.Analytics),
    metric: RAQIV2UIMetric.SessionDurationSeconds,
    totalSummaryType: { type: RAQIV2SummaryType.Average },
    overrides: {
      filter: {
        override: [
          { dimension: RAQIV2UIPseudoDimension.PercentileType, values: [RAQIV2PercentileType.AVG] },
        ],
      },
    },
  },
  [RAQIV2PredefinedSummaryItemKey.PerformanceClientCrashRate]: {
    labelKey: translationKey('Title.ClientCrashRate', TranslationNamespace.Analytics),
    metric: RAQIV2Metric.ClientCrashRate15m,
    totalSummaryType: { type: RAQIV2SummaryType.Average },
    overrides: {},
  },
  [RAQIV2PredefinedSummaryItemKey.PerformanceServerMemoryUsage]: {
    labelKey: translationKey('Title.ServerMemory', TranslationNamespace.Analytics),
    metric: RAQIV2UIMetric.ServerMemoryUsageV2,
    totalSummaryType: { type: RAQIV2SummaryType.Average },
    overrides: {
      filter: {
        override: [
          { dimension: RAQIV2UIPseudoDimension.PercentileType, values: [RAQIV2PercentileType.AVG] },
        ],
      },
    },
  },
  [RAQIV2PredefinedSummaryItemKey.PerformancePeakConcurrentPlayers]: {
    labelKey: translationKey('title.ConcurrentUsers', TranslationNamespace.Analytics),
    metric: RAQIV2Metric.PeakConcurrentPlayers,
    totalSummaryType: { type: RAQIV2SummaryType.Average },
    overrides: {},
  },
  [RAQIV2PredefinedSummaryItemKey.PerformanceClientFps]: {
    labelKey: translationKey('Title.ClientFps', TranslationNamespace.Analytics),
    metric: RAQIV2UIMetric.ClientFps,
    totalSummaryType: { type: RAQIV2SummaryType.Average },
    overrides: {
      filter: {
        override: [
          { dimension: RAQIV2UIPseudoDimension.PercentileType, values: [RAQIV2PercentileType.AVG] },
        ],
      },
    },
  },
};

export default RAQIV2PredefinedSummaryItemConfig;
