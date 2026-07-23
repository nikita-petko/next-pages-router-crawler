import { useCallback } from 'react';
import { Insight } from '@modules/clients/analytics';
import { InsightTypeV2 } from '@modules/experience-analytics-shared';
import { Signal, Report } from '@rbx/client-universe-analytics-insights/v1';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import {
  GenericAssistantReportSection,
  GenericAssistantReport,
  FeedbackReportSpec,
  ReportSectionType,
} from '../types/AssistantSummaryInsightSpec';
import { PlayerFeedbackReportUISignal } from '../types/AssistantUISignal';

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
  isPlayerFeedbackExampleCommentsEnabled: boolean = false,
): FeedbackReportSpec | null => {
  if (!insightDetail.summaryReportEvidence) {
    throw new Error('GetInsightsResponse with SummaryReport type missing summaryReportEvidence');
  }

  // Date will only be used for the report card title
  const endDate = new Date(insightDetail.createdUtcTime);
  const deltaDate =
    insightDetail.insightType === InsightTypeV2.PlayerFeedbackReport7Days
      ? SEVEN_DAYS_DELTA
      : TWENTYEIGHT_DAYS_DELTA;
  const startDate = new Date(endDate.getTime() - deltaDate);
  const report = adaptReport(insightDetail.summaryReportEvidence.report);

  return report.sections.length > 0
    ? {
        type: insightDetail.insightType as
          | InsightTypeV2.PlayerFeedbackReport7Days
          | InsightTypeV2.PlayerFeedbackReport28Days,
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
  const { isPlayerFeedbackExampleCommentsEnabled } = useFeatureFlagsForNamespace(
    'isPlayerFeedbackExampleCommentsEnabled',
    FeatureFlagNamespace.Analytics,
  );

  return useCallback(
    (insightDetail: Insight): FeedbackReportSpec | null => {
      return adaptFeedbackSummaryReportBase(insightDetail, isPlayerFeedbackExampleCommentsEnabled);
    },
    [isPlayerFeedbackExampleCommentsEnabled],
  );
};

export default useAdaptFeedbackSummaryReport;
