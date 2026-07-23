import { Insight } from '@modules/clients/analytics';
import {
  adaptAnalyticsAssistantRecommendations,
  adaptProductRecommendations,
  adaptSummaryReportDateRange,
  InsightTypeV2,
  TAnalyticsProductRecommendation,
} from '@modules/experience-analytics-shared';
import { Signal, SignalType, Report } from '@rbx/client-universe-analytics-insights/v1';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';

import { logAnalyticsError } from '@modules/charts-generic';
import {
  SummaryReportSpec,
  MetricsSummarySpec,
  GenericAssistantReport,
  GenericAssistantReportSection,
  ReportSectionType,
} from '../types/AssistantSummaryInsightSpec';
import { SummaryReportUISignal, isSummaryReportSignalMetric } from '../types/AssistantUISignal';
import { AssistantSummaryInsightType } from '../types/AssistantSummaryInsightType';
import {
  toValidatedSignal,
  toValidatedInsight,
  ValidatedSignal,
} from '../validation/makeValidatedInsightsV2API';

/**
 * Adapts a ValidatedSignal (from backend streaming) to a SummaryReportUISignal.
 *
 * This function is used by the AI chat flow where the backend streams ValidatedSignal
 * objects directly via data-signal parts.
 */
export const adaptValidatedSignal = (
  validatedSignal: ValidatedSignal,
): SummaryReportUISignal | undefined => {
  if (!isSummaryReportSignalMetric(validatedSignal.metric)) {
    logAnalyticsError(`Invalid metric: ${validatedSignal.metric}`);
    return undefined;
  }

  if (!validatedSignal.signalType) {
    logAnalyticsError(`Signal is missing signalType: ${validatedSignal.signalType}`);
    return undefined;
  }

  if (!validatedSignal.startUtcTime || !validatedSignal.endUtcTime) {
    logAnalyticsError(
      `Signal is missing start or end date: ${validatedSignal.startUtcTime} ${validatedSignal.endUtcTime}`,
    );
    return undefined;
  }

  const startDate = new Date(validatedSignal.startUtcTime);
  const endDate = new Date(validatedSignal.endUtcTime);

  // Map validated signal data to our UI signal format
  let signalMetadata: SummaryReportUISignal['signalMetadata'];

  switch (validatedSignal.signalData.signalType) {
    case SignalType.KpiChange:
      signalMetadata = { signalType: SignalType.KpiChange, data: validatedSignal.signalData.data };
      break;
    case SignalType.Outlier:
      signalMetadata = { signalType: SignalType.Outlier, data: validatedSignal.signalData.data };
      break;
    case SignalType.Benchmark:
      signalMetadata = { signalType: SignalType.Benchmark, data: validatedSignal.signalData.data };
      break;
    case SignalType.UnderPerformingSegments:
      signalMetadata = {
        signalType: SignalType.UnderPerformingSegments,
        data: validatedSignal.signalData.data,
      };
      break;
    case SignalType.OnboardingFunnel:
      signalMetadata = {
        signalType: SignalType.OnboardingFunnel,
        data: validatedSignal.signalData.data,
      };
      break;
    case SignalType.VirtualEvent:
      signalMetadata = { signalType: SignalType.VirtualEvent, data: undefined };
      break;
    case SignalType.PlayerFeedback:
      signalMetadata = { signalType: SignalType.PlayerFeedback, data: undefined };
      break;
    case SignalType.Invalid:
      signalMetadata = { signalType: SignalType.Invalid, data: undefined };
      break;
    case SignalType.RetentionPowerCurve:
      signalMetadata = {
        signalType: SignalType.RetentionPowerCurve,
        data: validatedSignal.signalData.data,
      };
      break;
    case SignalType.RatioKpiChangeAttribution:
      signalMetadata = {
        signalType: SignalType.RatioKpiChangeAttribution,
        data: validatedSignal.signalData.data,
      };
      break;
    case SignalType.SeasonalBenchmarkComparison:
      signalMetadata = {
        signalType: SignalType.SeasonalBenchmarkComparison,
        data: validatedSignal.signalData.data,
      };
      break;
    case SignalType.SignificantFunnelStep:
      signalMetadata = {
        signalType: SignalType.SignificantFunnelStep,
        data: validatedSignal.signalData.data,
      };
      break;
    case SignalType.Generic:
      signalMetadata = {
        signalType: SignalType.Generic,
        data: validatedSignal.signalData.data,
      };
      break;
    default: {
      const exhaustiveCheck: never = validatedSignal.signalData;
      throw new Error(`Unhandled signal type: ${exhaustiveCheck}`);
    }
  }

  return {
    metric: validatedSignal.metric,
    signalType: validatedSignal.signalType,
    startDate,
    endDate,
    signalMetadata,
  };
};

/**
 * Adapts a raw Signal (from insight API) to a SummaryReportUISignal.
 * Internally validates the signal first using toValidatedSignal.
 */
const adaptSignal = (signal: Signal): SummaryReportUISignal | undefined => {
  // Use validation to convert dangerous proto types to safe types
  const validatedSignal = toValidatedSignal(signal);
  return adaptValidatedSignal(validatedSignal);
};

const adaptContent = (
  content: string,
  insightType:
    | InsightTypeV2.SummaryReport
    | InsightTypeV2.SummaryReport7Days
    | InsightTypeV2.MetricsSummary,
): string => {
  if (insightType === InsightTypeV2.MetricsSummary) {
    // Remove heading lines (lines that start with #) and backticks for metrics_summary
    return content
      .split('\n')
      .filter((line) => !line.trim().startsWith('#'))
      .join('\n')
      .replaceAll('`', '')
      .trim();
  }
  return content;
};

const adaptReport = <
  T extends
    | InsightTypeV2.SummaryReport
    | InsightTypeV2.SummaryReport7Days
    | InsightTypeV2.MetricsSummary,
>(
  insightType: T,
  recommendations: TAnalyticsProductRecommendation[],
  report?: Report,
): GenericAssistantReport<T> => {
  const sections: GenericAssistantReportSection<T>[] = [];

  // Track canvas section index for sectionId generation
  let canvasSectionIndex = 0;

  const originalSections =
    report?.sections
      ?.map((section) => {
        return {
          content: adaptContent(section.content ?? '', insightType),
          canvas: section.signals?.map(adaptSignal).filter((signal) => signal !== undefined) ?? [],
          recommendations: adaptAnalyticsAssistantRecommendations(
            recommendations,
            section.recommendations,
          ),
        };
      })
      // Filter out sections with no content
      .filter((section) => section.content.trim()) ?? [];

  // Convert each section to V2 format
  originalSections.forEach((section, index) => {
    const hasCanvas = section.canvas.length > 0;
    const hasNonProductRec = section.recommendations?.type === 'non-product';

    // Extract product recommendations for this section
    const productRecommendations =
      section.recommendations?.type === 'product' ? section.recommendations.recommendations : [];

    if (index === 0 && insightType !== InsightTypeV2.MetricsSummary) {
      const content = `**Overview**\n\n${section.content}`;
      sections.push({
        type: ReportSectionType.Text,
        content,
        recommendations: productRecommendations,
      });
      return;
    }

    if (hasCanvas) {
      // Canvas section
      sections.push({
        type: ReportSectionType.Canvas,
        content: section.content,
        canvas: section.canvas,
        sectionId: canvasSectionIndex.toString(),
      });
      canvasSectionIndex += 1;
    } else if (hasNonProductRec) {
      // Link section - convert non-product recommendation to link data
      if (section.recommendations?.type === 'non-product') {
        sections.push({
          type: ReportSectionType.Link,
          content: section.content,
          linkData: {
            recommendationType: section.recommendations.recommendation.recommendationType,
          },
        });
      }
    } else {
      // Content-only section
      sections.push({
        type: ReportSectionType.Text,
        content: section.content,
        recommendations: productRecommendations,
      });
    }
  });

  return { sections };
};

const adaptSummaryReport = (insightDetail: Insight): SummaryReportSpec | null => {
  // Use validation to convert dangerous proto types to safe types
  const validatedInsight = toValidatedInsight(insightDetail);

  if (!insightDetail.summaryReportEvidence) {
    throw new Error('GetInsightsResponse with SummaryReport type missing summaryReportEvidence');
  }

  const { insightType } = validatedInsight;
  if (
    !insightType ||
    !isValidArrayEnumValue(AssistantSummaryInsightType, insightType) ||
    (insightType !== InsightTypeV2.SummaryReport &&
      insightType !== InsightTypeV2.SummaryReport7Days)
  ) {
    throw new Error('Insight is missing insightType');
  }

  const evidence = insightDetail.summaryReportEvidence;
  const signals = evidence.signals || [];

  if (signals.length === 0) {
    throw new Error('SummaryReport evidence missing signals data');
  }

  const { startDate, endDate } = adaptSummaryReportDateRange(signals, insightType);
  const recommendations = adaptProductRecommendations(insightDetail.recommendations);
  const report = adaptReport<InsightTypeV2.SummaryReport | InsightTypeV2.SummaryReport7Days>(
    insightType,
    recommendations,
    evidence.report,
  );

  return report.sections.length > 0
    ? {
        type: insightType,
        insightId: validatedInsight.id,
        startDate,
        endDate,
        snoozeKey: insightDetail.snoozeKey,
        recommendations,
        report,
      }
    : null;
};

export const adaptMetricsSummaryReport = (insightDetail: Insight): MetricsSummarySpec | null => {
  // Use validation to convert dangerous proto types to safe types
  const validatedInsight = toValidatedInsight(insightDetail);

  if (!insightDetail.metricsSummaryEvidence) {
    throw new Error('GetInsightsResponse with MetricsSummary type missing metricsSummaryEvidence');
  }

  const { insightType } = validatedInsight;
  if (
    !insightType ||
    !isValidArrayEnumValue(AssistantSummaryInsightType, insightType) ||
    insightType !== InsightTypeV2.MetricsSummary
  ) {
    throw new Error('Insight is missing insightType or has incorrect type');
  }

  const evidence = insightDetail.metricsSummaryEvidence;
  const startUtcTime = evidence.input?.startUtcTime;
  const endUtcTime = evidence.input?.endUtcTime;

  if (!startUtcTime || !endUtcTime) {
    throw new Error('MetricsSummary evidence missing start or end time in input');
  }

  const startDate = new Date(startUtcTime);
  const endDate = new Date(endUtcTime);
  const recommendations = adaptProductRecommendations(insightDetail.recommendations);
  const report = adaptReport<InsightTypeV2.MetricsSummary>(
    insightType,
    recommendations,
    evidence.report,
  );

  return report.sections.length > 0
    ? {
        type: insightType,
        insightId: validatedInsight.id,
        startDate,
        endDate,
        snoozeKey: insightDetail.snoozeKey,
        recommendations,
        report,
      }
    : null;
};

export default adaptSummaryReport;
