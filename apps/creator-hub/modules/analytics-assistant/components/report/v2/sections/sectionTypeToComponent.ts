import type { FC } from 'react';
import { RecommendationType } from '@modules/clients/analytics';
import type { TAnalyticsNonProductRecommendationType } from '@modules/experience-analytics-shared/types/assistant/AnalyticsAssistantRecommendations';
import { ReportSectionType } from '../../../../types/AssistantSummaryInsightSpec';
import type { TAssistantSummaryInsight } from '../../../../types/AssistantSummaryInsightType';
import CanvasReportSection from './CanvasReportSection';
import GenericReportSectionV2 from './GenericReportSectionV2';
import PlayerFeedbackLinkSection from './PlayerFeedbackLinkSection';
import type { SectionComponentProps } from './types';

const getLinkSectionComponent = (
  recommendationType: TAnalyticsNonProductRecommendationType,
): FC<SectionComponentProps<TAssistantSummaryInsight>> => {
  switch (recommendationType) {
    case RecommendationType.ViewPlayerFeedback:
      return PlayerFeedbackLinkSection;
    default: {
      const exhaustiveCheck: never = recommendationType;
      throw new Error(`Unhandled link recommendation type: ${exhaustiveCheck}`);
    }
  }
};

const sectionTypeToComponent = (
  sectionType: ReportSectionType,
  recommendationType?: TAnalyticsNonProductRecommendationType,
  hideCanvas?: boolean,
): FC<SectionComponentProps<TAssistantSummaryInsight>> => {
  if (hideCanvas) {
    return GenericReportSectionV2;
  }

  switch (sectionType) {
    case ReportSectionType.Canvas:
      return CanvasReportSection;
    case ReportSectionType.Link:
      if (!recommendationType) {
        throw new Error('Link sections require a recommendationType');
      }
      return getLinkSectionComponent(recommendationType);
    case ReportSectionType.Text:
      return GenericReportSectionV2;
    default: {
      const exhaustiveCheck: never = sectionType;
      throw new Error(`Unhandled section type: ${exhaustiveCheck}`);
    }
  }
};

export default sectionTypeToComponent;
