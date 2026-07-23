import type {
  TAnalyticsNonProductRecommendationType,
  TAnalyticsProductRecommendation,
} from '@modules/experience-analytics-shared/types/assistant/AnalyticsAssistantRecommendations';
import type { InsightTypeV2 } from '@modules/experience-analytics-shared/types/insights';
import type { TAssistantSummaryInsight } from './AssistantSummaryInsightType';
import type { SignalTypeForInsight } from './AssistantUISignal';

export enum ReportSectionType {
  Canvas = 'canvas',
  Link = 'link',
  Text = 'text',
}

export type LinkSectionData = {
  recommendationType: TAnalyticsNonProductRecommendationType;
  // Future: could add static URL for non-dynamic links like staticUrl?: string;
};

export type GenericAssistantReportSection<T extends TAssistantSummaryInsight> =
  | {
      type: ReportSectionType.Canvas;
      content: string;
      canvas: SignalTypeForInsight<T>[];
      sectionId: string;
    }
  | {
      type: ReportSectionType.Link;
      content: string;
      linkData: LinkSectionData;
    }
  | {
      type: ReportSectionType.Text;
      content: string;
      recommendations?: TAnalyticsProductRecommendation[];
    };

export type GenericAssistantReport<T extends TAssistantSummaryInsight> = {
  sections: GenericAssistantReportSection<T>[];
};

export type GenericAssistantSummaryInsightInfo<T extends TAssistantSummaryInsight> = {
  type: T;
  insightId: string;
  startDate: Date;
  endDate: Date;
  snoozeKey: string;

  report: GenericAssistantReport<T>;
  hideCanvas?: boolean;
};

export type SummaryReportSpec = GenericAssistantSummaryInsightInfo<
  InsightTypeV2.SummaryReport | InsightTypeV2.SummaryReport7Days
> & {
  // NOTE(lucaswang, 2025-06-20): The top level recommendations only contain product recommendations.
  recommendations: TAnalyticsProductRecommendation[];
};

export type FeedbackReportSpec = GenericAssistantSummaryInsightInfo<
  InsightTypeV2.PlayerFeedbackReport7Days | InsightTypeV2.PlayerFeedbackReport28Days
> & {
  exampleCommentsCount: number;
};

export type MetricsSummarySpec =
  GenericAssistantSummaryInsightInfo<InsightTypeV2.MetricsSummary> & {
    recommendations: TAnalyticsProductRecommendation[];
  };

export type AssistantSummaryInsightSpec =
  | SummaryReportSpec
  | FeedbackReportSpec
  | MetricsSummarySpec;
