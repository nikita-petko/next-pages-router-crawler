import { Insight } from '@modules/clients/analytics';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { ChartResourceType } from '@modules/clients/analytics/analyticsRAQIShared';
import { FeedbackReportCardSpec, InsightTypeV2 } from '../types/insights';
import RAQIV2PredefinedChartKey from '../constants/RAQIV2PredefinedChartKey';

const adaptFeedbackReport = (insight: Insight): FeedbackReportCardSpec => {
  if (!insight.summaryReportEvidence) {
    throw new Error('GetInsightsResponse with SummaryReport type missing summaryReportEvidence');
  }

  const { insightType } = insight;
  if (
    !insightType ||
    (insightType !== InsightTypeV2.PlayerFeedbackReport7Days &&
      insightType !== InsightTypeV2.PlayerFeedbackReport28Days)
  ) {
    throw new Error('Insight is missing insightType');
  }

  const evidence = insight.summaryReportEvidence;
  const date = new Date(insight.createdUtcTime);

  return {
    type: insightType as
      | InsightTypeV2.PlayerFeedbackReport7Days
      | InsightTypeV2.PlayerFeedbackReport28Days,
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
