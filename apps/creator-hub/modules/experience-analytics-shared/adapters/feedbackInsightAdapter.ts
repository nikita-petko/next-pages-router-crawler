import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { Insight } from '@modules/clients/analytics';
import { ChartResourceType } from '@modules/clients/analytics/analyticsRAQIShared';
import RAQIV2PredefinedChartKey from '../constants/RAQIV2PredefinedChartKey';
import type { FeedbackReportCardSpec } from '../types/insights';
import { InsightTypeV2 } from '../types/insights';

type PlayerFeedbackInsightType =
  | InsightTypeV2.PlayerFeedbackReport7Days
  | InsightTypeV2.PlayerFeedbackReport28Days;

const isPlayerFeedbackInsightType = (
  insightType: unknown,
): insightType is PlayerFeedbackInsightType =>
  insightType === InsightTypeV2.PlayerFeedbackReport7Days ||
  insightType === InsightTypeV2.PlayerFeedbackReport28Days;

const adaptFeedbackReport = (insight: Insight): FeedbackReportCardSpec => {
  if (!insight.summaryReportEvidence) {
    throw new Error('GetInsightsResponse with SummaryReport type missing summaryReportEvidence');
  }

  const { insightType } = insight;
  if (!isPlayerFeedbackInsightType(insightType)) {
    throw new Error('Insight is missing insightType');
  }

  const evidence = insight.summaryReportEvidence;
  const date = new Date(insight.createdUtcTime);

  return {
    type: insightType,
    insightId: insight.id,
    reportSummary: evidence?.report?.sections?.[0]?.content ?? '',
    newSignalCount: 0,
    // NOTE: params below are not used for the player feedback report
    startDate: date,
    endDate: date,
    date,
    snoozeKey: insight.snoozeKey,
    chartKey: RAQIV2PredefinedChartKey.AcquisitionHomeRecommendationQualifiedPTR,
    recommendations: [],
    summaryValue: 0,
    context: {
      resource: {
        id: insight.universeId,
        type: ChartResourceType.Universe,
      },
      timeSpec: {
        rangeType: RAQIV2DateRangeType.Custom,
        startTime: date,
        endTime: date,
      },
      granularity: RAQIV2MetricGranularity.None,
      breakdown: [],
      filter: [],
      timeAxisBounds: null,
    },
  };
};

export default adaptFeedbackReport;
