import { useCallback } from 'react';
import type { Signal, Report } from '@rbx/client-universe-analytics-insights/v1';
import { useFlag } from '@rbx/flags';
import { isPlayerFeedbackExampleCommentsEnabled as isPlayerFeedbackExampleCommentsEnabledFlag } from '@generated/flags/creatorAnalytics';
import type { Insight } from '@modules/clients/analytics';
import { InsightTypeV2 } from '@modules/experience-analytics-shared/types/insights';
import type {
  GenericAssistantReportSection,
  GenericAssistantReport,
  FeedbackReportSpec,
} from '../types/AssistantSummaryInsightSpec';
import { ReportSectionType } from '../types/AssistantSummaryInsightSpec';
import type { PlayerFeedbackReportUISignal } from '../types/AssistantUISignal';

type PlayerFeedbackInsightType =
  | InsightTypeV2.PlayerFeedbackReport7Days
  | InsightTypeV2.PlayerFeedbackReport28Days;

const isPlayerFeedbackInsightType = (
  insightType: unknown,
): insightType is PlayerFeedbackInsightType => {
  switch (insightType) {
    case InsightTypeV2.PlayerFeedbackReport7Days:
    case InsightTypeV2.PlayerFeedbackReport28Days:
      return true;
    default:
      return false;
  }
};

// Inclusive of start and end date
const SEVEN_DAYS_DELTA = 6 * 24 * 60 * 60 * 1000;
const TWENTYEIGHT_DAYS_DELTA = 27 * 24 * 60 * 60 * 1000;

const adaptSignal = (signal: Signal): PlayerFeedbackReportUISignal | undefined => {
  if (!signal.playerFeedbackExamples) {
    throw new Error('Signal is missing playerFeedbackExamples');
  }

  return {
    feedbackExamples: signal.playerFeedbackExamples,
  };
};

const adaptReport = (
  report?: Report,
): GenericAssistantReport<
  InsightTypeV2.PlayerFeedbackReport7Days | InsightTypeV2.PlayerFeedbackReport28Days
> => {
  const sections: GenericAssistantReportSection<
    InsightTypeV2.PlayerFeedbackReport7Days | InsightTypeV2.PlayerFeedbackReport28Days
  >[] = [];

  const originalSections =
    report?.sections
      ?.map((section) => ({
        content: section.content ?? '',
        canvas:
          section.signals
            ?.map((signal) => adaptSignal(signal))
            .filter((signal): signal is PlayerFeedbackReportUISignal => signal !== undefined) ?? [],
      }))
      // Filter out sections with no content
      .filter((section) => section.content.trim()) ?? [];

  let canvasSectionIndex = 0;
  originalSections.forEach((section) => {
    const hasCanvas = section.canvas.length > 0;

    if (hasCanvas) {
      // Canvas section
      sections.push({
        type: ReportSectionType.Canvas,
        content: section.content,
        canvas: section.canvas,
        sectionId: canvasSectionIndex.toString(),
      });
      canvasSectionIndex += 1;
    } else {
      // Content-only section
      sections.push({
        type: ReportSectionType.Text,
        content: section.content,
      });
    }
  });

  return { sections };
};

const adaptFeedbackSummaryReportBase = (
  insightDetail: Insight,
  isPlayerFeedbackExampleCommentsEnabled = false,
): FeedbackReportSpec | null => {
  const insightType = insightDetail.insightType;
  if (!isPlayerFeedbackInsightType(insightType)) {
    return null;
  }

  if (!insightDetail.summaryReportEvidence) {
    throw new Error('GetInsightsResponse with SummaryReport type missing summaryReportEvidence');
  }

  let deltaDate: number;
  switch (insightType) {
    case InsightTypeV2.PlayerFeedbackReport7Days: {
      deltaDate = SEVEN_DAYS_DELTA;
      break;
    }
    case InsightTypeV2.PlayerFeedbackReport28Days: {
      deltaDate = TWENTYEIGHT_DAYS_DELTA;
      break;
    }
    default: {
      const exhaustiveCheck: never = insightType;
      throw new Error(`Unhandled player feedback insight type: ${String(exhaustiveCheck)}`);
    }
  }

  // Date will only be used for the report card title
  const endDate = new Date(insightDetail.createdUtcTime);
  const startDate = new Date(endDate.getTime() - deltaDate);
  const report = adaptReport(insightDetail.summaryReportEvidence.report);

  return report.sections.length > 0
    ? {
        type: insightType,
        insightId: insightDetail.id,
        report,
        startDate,
        endDate,
        hideCanvas: !isPlayerFeedbackExampleCommentsEnabled,
        snoozeKey: insightDetail.snoozeKey,
        exampleCommentsCount: insightDetail.summaryReportEvidence.totalNumberOfExamples ?? 0,
      }
    : null;
};

export const useAdaptFeedbackSummaryReport = () => {
  const {
    ready: isPlayerFeedbackExampleCommentsReady,
    value: isPlayerFeedbackExampleCommentsEnabledValue,
  } = useFlag(isPlayerFeedbackExampleCommentsEnabledFlag);
  const isPlayerFeedbackExampleCommentsEnabled =
    isPlayerFeedbackExampleCommentsReady && isPlayerFeedbackExampleCommentsEnabledValue;

  return useCallback(
    (insightDetail: Insight): FeedbackReportSpec | null => {
      return adaptFeedbackSummaryReportBase(insightDetail, isPlayerFeedbackExampleCommentsEnabled);
    },
    [isPlayerFeedbackExampleCommentsEnabled],
  );
};

export default useAdaptFeedbackSummaryReport;
