import { formatNumberWithSpec, percentageFormattingSpec } from '@modules/charts-generic';

import {
  FormattedText,
  translationKey,
  TranslationKey,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations';

import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RecommendationType } from '@modules/clients/analytics';
import { Locale } from '@rbx/intl';
import RAQIV2PredefinedChartKey from '../constants/RAQIV2PredefinedChartKey';
import { TChartEventLogging, ChartLoggingContext } from './ChartEventLogger';
import RAQIV2ChartContext from './RAQIV2ChartContext';
import { AchievementChartKeys } from './achievements';
import { TRAQIV2PredefinedChartKey } from '../constants/RAQIV2PredefinedChartConfig';

export enum InsightTypeV2 {
  PercentChange = 'INSIGHT_TYPE_PERCENT_CHANGE',
  PeriodHigh = 'INSIGHT_TYPE_PERIOD_HIGH',
  LowEndAndroidCrashRate = 'INSIGHT_TYPE_LOW_END_ANDROID_CRASH_RATE',
  ExperienceQuality = 'INSIGHT_TYPE_EXPERIENCE_QUALITY',
  SummaryReport = 'INSIGHT_TYPE_SUMMARY_REPORT',
  SummaryReport7Days = 'INSIGHT_TYPE_SUMMARY_REPORT_7_DAYS',
  PlayerFeedbackReport7Days = 'INSIGHT_TYPE_PLAYER_FEEDBACK_REPORT_7_DAYS',
  PlayerFeedbackReport28Days = 'INSIGHT_TYPE_PLAYER_FEEDBACK_REPORT_28_DAYS',
  AbuseReport = 'INSIGHT_TYPE_UNIQUE_ABUSE_REPORT_SUBMITTERS_1K_PLAYTIME_HOURS',
  MetricsSummary = 'INSIGHT_TYPE_METRICS_SUMMARY',
  AdsPerformance7Days = 'INSIGHT_TYPE_ADS_PERFORMANCE_7_DAYS',
}

export const InsightCardType = {
  [InsightTypeV2.PercentChange]: InsightTypeV2.PercentChange,
  [InsightTypeV2.LowEndAndroidCrashRate]: InsightTypeV2.LowEndAndroidCrashRate,
  [InsightTypeV2.ExperienceQuality]: InsightTypeV2.ExperienceQuality,
  [InsightTypeV2.SummaryReport]: InsightTypeV2.SummaryReport,
  [InsightTypeV2.SummaryReport7Days]: InsightTypeV2.SummaryReport7Days,
  [InsightTypeV2.PlayerFeedbackReport7Days]: InsightTypeV2.PlayerFeedbackReport7Days,
  [InsightTypeV2.PlayerFeedbackReport28Days]: InsightTypeV2.PlayerFeedbackReport28Days,
  [InsightTypeV2.AdsPerformance7Days]: InsightTypeV2.AdsPerformance7Days,
} as const;
export type InsightCardType = (typeof InsightCardType)[keyof typeof InsightCardType];

export type GenericInsightInfo = {
  insightId: string;
  date: Date;
  snoozeKey: string;
};

export type InsightAchievementSpec = GenericInsightInfo & {
  type: InsightTypeV2.PeriodHigh;
  chartKey: AchievementChartKeys;
  currentValue: number | null;
};

type GenericInsightCardSpec = GenericInsightInfo & {
  type: InsightCardType;
  recommendations: RecommendationType[];
  chartKey: TRAQIV2PredefinedChartKey;
  context: RAQIV2ChartContext;
  summaryValue: number;
};

export type PeriodicHighInsightCardSpec = GenericInsightCardSpec & {
  type: InsightTypeV2.PeriodHigh;
  captionInfo?: number;
};

export type PercentChangeInsightCardSpec = GenericInsightCardSpec & {
  type: InsightTypeV2.PercentChange;
  captionInfo?: { benchmarkComparisonRank: number; benchmarkPercentChange: number };
};

export type LowEndAndroidCrashRateSpec = GenericInsightCardSpec & {
  type: InsightTypeV2.LowEndAndroidCrashRate;
  titleInfo: { placeName: string };
  captionInfo: { totalCrashRate: number };
  chartInfo: {
    totalCrashRate: number;
    lowEndAndroidCrashRate: number;
  };
  suggestionsInfo: {
    ccuRatio: number;
    placeId: number;
  };
};

export type QualitySignalCardsSpec = GenericInsightCardSpec & {
  type: InsightTypeV2.ExperienceQuality;
  captionInfo?: object;
  showDefaultPlaceCard: boolean;
  showDefaultNameDescriptionCard: boolean;
  showDefaultIconCard: boolean;
  showDefaultThumbnailCard: boolean;
  showCompleteGuidelinesCard: boolean;
};

export type GenericAssistantReportCardSpec = GenericInsightCardSpec & {
  reportSummary: string;
  startDate: Date;
  endDate: Date;
  captionInfo?: object;
  newSignalCount: number;
};

// Union of all assistant report insight types
export type AssistantReportInsightType =
  | InsightTypeV2.SummaryReport
  | InsightTypeV2.SummaryReport7Days
  | InsightTypeV2.PlayerFeedbackReport7Days
  | InsightTypeV2.PlayerFeedbackReport28Days;

// Generic assistant report card spec
export type AssistantReportCardSpec<
  T extends AssistantReportInsightType = AssistantReportInsightType,
> = GenericAssistantReportCardSpec & {
  type: T;
};

export type SummaryReportCardSpec = AssistantReportCardSpec<InsightTypeV2.SummaryReport>;
export type SummaryReport7DaysCardSpec = AssistantReportCardSpec<InsightTypeV2.SummaryReport7Days>;
export type FeedbackReportCardSpec = AssistantReportCardSpec<
  InsightTypeV2.PlayerFeedbackReport7Days | InsightTypeV2.PlayerFeedbackReport28Days
>;

export const hasValidReportSummary = <T extends GenericAssistantReportCardSpec>(
  spec: T,
): boolean => {
  return spec.reportSummary.length > 0;
};

export type AdsPerformanceCardSpec = GenericInsightCardSpec & {
  type: InsightTypeV2.AdsPerformance7Days;
  captionInfo: {
    adsPlaysL7: number;
  };
};

export type InsightCardSpec =
  | PercentChangeInsightCardSpec
  | PeriodicHighInsightCardSpec
  | LowEndAndroidCrashRateSpec
  | QualitySignalCardsSpec
  | SummaryReportCardSpec
  | SummaryReport7DaysCardSpec
  | FeedbackReportCardSpec
  | AdsPerformanceCardSpec;

export const insightCardTypeToTranslationKey: Record<
  InsightCardType,
  { header: TranslationKey; button: TranslationKey; caption: TranslationKey }
> = {
  [InsightTypeV2.PercentChange]: {
    header: translationKey('Header.WeeklyChange', TranslationNamespace.Insights),
    button: translationKey('Action.ExploreThisMetric', TranslationNamespace.Insights),
    caption: translationKey('Caption.WeeklyChange', TranslationNamespace.Insights),
  },
  [InsightTypeV2.LowEndAndroidCrashRate]: {
    header: translationKey('Header.LowEndAndroidOpportunity', TranslationNamespace.Insights),
    button: translationKey('Action.TakeActionNow', TranslationNamespace.Insights),
    caption: translationKey('Caption.AllDevicesComparison', TranslationNamespace.Insights),
  },
  [InsightTypeV2.ExperienceQuality]: {
    header: translationKey('Description.QualitySignalTips', TranslationNamespace.Insights),
    button: {
      key: '',
      namespace: undefined,
    },
    caption: {
      key: '',
      namespace: undefined,
    },
  },
  [InsightTypeV2.SummaryReport]: {
    header: translationKey('Header.SummaryReportWithDateRange', TranslationNamespace.Insights),
    button: translationKey('Action.ViewReport', TranslationNamespace.Insights),
    caption: translationKey('Caption.SummaryReportMonthly', TranslationNamespace.Insights),
  },
  [InsightTypeV2.SummaryReport7Days]: {
    header: translationKey('Header.SummaryReportWithDateRange', TranslationNamespace.Insights),
    button: translationKey('Action.ViewReport', TranslationNamespace.Insights),
    caption: translationKey('Caption.SummaryReportWeekly', TranslationNamespace.Insights),
  },
  [InsightTypeV2.PlayerFeedbackReport7Days]: {
    header: translationKey('Header.FeedbackReport', TranslationNamespace.Insights),
    button: translationKey('Action.ViewReport', TranslationNamespace.Insights),
    caption: {
      key: '',
      namespace: undefined,
    },
  },
  [InsightTypeV2.PlayerFeedbackReport28Days]: {
    header: translationKey('Header.FeedbackReport', TranslationNamespace.Insights),
    button: translationKey('Action.ViewReport', TranslationNamespace.Insights),
    caption: {
      key: '',
      namespace: undefined,
    },
  },
  [InsightTypeV2.AdsPerformance7Days]: {
    header: translationKey('Header.AdsPerformance', TranslationNamespace.Insights),
    button: translationKey('Action.ViewAdsManager', TranslationNamespace.Insights),
    caption: {
      key: '',
      namespace: undefined,
    },
  },
};

export const getInsightCardButtonKey = (type: InsightCardType, key: RAQIV2PredefinedChartKey) => {
  if (key === RAQIV2PredefinedChartKey.QualifiedPTRAndImpressionComparison) {
    return translationKey('Action.ExploreRFYSignals', TranslationNamespace.Insights);
  }
  return insightCardTypeToTranslationKey[type].button;
};

export const getInsightCardCaptions = (
  translate: TranslationKeyToFormattedText,
  locale: Locale,
  spec: InsightCardSpec,
): FormattedText | null => {
  if (!spec.captionInfo) {
    return null;
  }

  const { type } = spec;
  switch (type) {
    case InsightTypeV2.PercentChange: {
      const { benchmarkComparisonRank, benchmarkPercentChange } = spec.captionInfo;
      return translate(insightCardTypeToTranslationKey[InsightTypeV2.PercentChange].caption, {
        benchmarkPercentChange:
          (benchmarkPercentChange > 0 ? '+' : '') +
          formatNumberWithSpec(benchmarkPercentChange, percentageFormattingSpec, {
            translate,
            locale,
          }),
        benchmarkComparisonRank: formatNumberWithSpec(
          benchmarkComparisonRank,
          {
            abbreviate: false,
            numberFormatOptions: {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            },
          },
          {
            translate,
            locale,
          },
        ),
      });
    }
    case InsightTypeV2.LowEndAndroidCrashRate: {
      const { totalCrashRate } = spec.captionInfo;
      return translate(
        insightCardTypeToTranslationKey[InsightTypeV2.LowEndAndroidCrashRate].caption,
        {
          percentage: formatNumberWithSpec(totalCrashRate, percentageFormattingSpec, {
            translate,
            locale,
          }),
        },
      );
    }
    case InsightTypeV2.ExperienceQuality: {
      return null;
    }
    case InsightTypeV2.SummaryReport:
    case InsightTypeV2.SummaryReport7Days:
    case InsightTypeV2.PlayerFeedbackReport7Days:
    case InsightTypeV2.PlayerFeedbackReport28Days: {
      return null;
    }
    case InsightTypeV2.AdsPerformance7Days: {
      return null;
    }
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unhandled Insight type ${exhaustiveCheck}`);
    }
  }
};

export const chartEventLogging: TChartEventLogging = {
  eventNames: {
    chartImpression: 'analytics/insights/chartImpression',
    hoverImpression: 'analytics/insights/chartHoverImpression',
  },
  context: ChartLoggingContext.InsightCard,
};
