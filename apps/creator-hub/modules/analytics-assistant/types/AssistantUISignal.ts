import { PlayerFeedbackExamples, SignalType } from '@rbx/client-universe-analytics-insights/v1';
import { RAQIV2Metric, RAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { InsightTypeV2 } from '@modules/experience-analytics-shared';
import { TAssistantSummaryInsight } from './AssistantSummaryInsightType';
import {
  ValidatedKpiChangeData,
  ValidatedOnboardingFunnelData,
  ValidatedOutlierData,
  ValidatedBenchmarkData,
  ValidatedUnderPerformingSegmentData,
  ValidatedRetentionPowerCurveData,
  ValidatedRatioKpiChangeAttributionData,
  ValidatedSeasonalBenchmarkComparisonData,
  ValidatedSignificantFunnelStepData,
  ValidatedGenericSignalData,
} from '../validation/makeValidatedInsightsV2API';

export enum NonRAQIAssistantMetric {
  DailyItemRevenue = 'DailyItemRevenue',
  VirtualEvent = 'VirtualEvent',
  PlayerFeedback = 'PlayerFeedback',
  RetentionPowerCurve = 'RetentionPowerCurve',
  RatioKpiChangeAttribution = 'RatioKpiChangeAttribution',
}

export type SummaryReportSignalMetric = RAQIV2Metric | RAQIV2UIMetric | NonRAQIAssistantMetric;

export function isSummaryReportSignalMetric(metric?: string): metric is SummaryReportSignalMetric {
  if (!metric) return false;
  return (
    isValidEnumValue(NonRAQIAssistantMetric, metric) ||
    isValidEnumValue(RAQIV2Metric, metric) ||
    isValidEnumValue(RAQIV2UIMetric, metric)
  );
}

type SignalTypeDataMap = {
  [SignalType.KpiChange]: ValidatedKpiChangeData;
  [SignalType.Outlier]: ValidatedOutlierData;
  [SignalType.Benchmark]: ValidatedBenchmarkData;
  [SignalType.UnderPerformingSegments]: ValidatedUnderPerformingSegmentData;
  [SignalType.OnboardingFunnel]: ValidatedOnboardingFunnelData;
  [SignalType.VirtualEvent]: undefined;
  [SignalType.PlayerFeedback]: undefined;
  [SignalType.Invalid]: undefined;
  [SignalType.RetentionPowerCurve]: ValidatedRetentionPowerCurveData;
  [SignalType.RatioKpiChangeAttribution]: ValidatedRatioKpiChangeAttributionData;
  [SignalType.SeasonalBenchmarkComparison]: ValidatedSeasonalBenchmarkComparisonData;
  [SignalType.SignificantFunnelStep]: ValidatedSignificantFunnelStepData;
  [SignalType.Generic]: ValidatedGenericSignalData;
};

export type DataForSignalType<T extends SignalType> = SignalTypeDataMap[T];

export type SignalMetadata = {
  [K in SignalType]: {
    signalType: K;
    data: DataForSignalType<K>;
  };
}[SignalType];

export type SummaryReportUISignal = {
  metric: SummaryReportSignalMetric;
  signalType: SignalType;
  startDate: Date;
  endDate: Date;
  signalMetadata?: SignalMetadata;
};

export type PlayerFeedbackReportUISignal = {
  feedbackExamples: PlayerFeedbackExamples;
};

type InsightTypeSignalMap = {
  [InsightTypeV2.SummaryReport]: SummaryReportUISignal;
  [InsightTypeV2.SummaryReport7Days]: SummaryReportUISignal;
  [InsightTypeV2.PlayerFeedbackReport7Days]: PlayerFeedbackReportUISignal;
  [InsightTypeV2.PlayerFeedbackReport28Days]: PlayerFeedbackReportUISignal;
  [InsightTypeV2.MetricsSummary]: SummaryReportUISignal;
};

export type SignalTypeForInsight<T extends TAssistantSummaryInsight> = InsightTypeSignalMap[T];

export type AnalyticsAssistantUISignal = SummaryReportUISignal | PlayerFeedbackReportUISignal;
