import {
  InsightTypeV2,
  useApiRequest,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import { useCallback } from 'react';
import { useGetMostRecentInsights } from '@modules/react-query/universeAnalyticsInsights';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { RAQIV2Dimension, RAQIV2AbuseChannel } from '@rbx/creator-hub-analytics-config';

const ABUSE_REPORT_INSIGHT_TYPES = [InsightTypeV2.AbuseReport];

export type AbuseReportSubmittersInsightSpec =
  | {
      universeId: number;
      channel: 'Total';
      subChannels: RAQIV2AbuseChannel[];
    }
  | {
      universeId: number;
      channel: RAQIV2AbuseChannel;
    };

const useGetAbuseReportInsight = () => {
  const { id: universeId } = useUniverseResource();
  const { data: insightsData } = useGetMostRecentInsights(universeId, ABUSE_REPORT_INSIGHT_TYPES);

  const makeGetAbuseReportInsightRequest =
    useCallback(async (): Promise<AbuseReportSubmittersInsightSpec | null> => {
      if (!insightsData) {
        return null;
      }

      // There should only be one abuse report insight.
      const abuseReportInsight = insightsData.find(
        (insight) => insight.insightType === InsightTypeV2.AbuseReport,
      );

      if (!abuseReportInsight?.abuseReportEvidence) {
        return null;
      }

      const { abuseReportEvidence } = abuseReportInsight;
      const { breakdowns } = abuseReportEvidence;

      // Filter breakdowns to only AbuseChannel dimension with valid values
      const abuseChannelBreakdowns =
        breakdowns?.filter(
          (breakdown) => breakdown.dimension === RAQIV2Dimension.AbuseChannel && breakdown.value,
        ) ?? [];

      if (abuseChannelBreakdowns.length === 0) {
        return {
          universeId,
          channel: 'Total',
          subChannels: [],
        };
      }

      // Check if 'Total' is present in the breakdowns
      const hasTotalBreakdown = abuseChannelBreakdowns.find(
        (breakdown) => breakdown.value === 'Total',
      );

      // Get all valid RAQIV2AbuseChannel values (excluding 'Total')
      const validAbuseChannels = abuseChannelBreakdowns
        .map((breakdown) => breakdown.value!)
        .filter(
          (value): value is RAQIV2AbuseChannel =>
            value !== 'Total' && isValidEnumValue(RAQIV2AbuseChannel, value),
        );

      if (hasTotalBreakdown) {
        // Total breakdown found - return Total with all valid channels
        return {
          universeId,
          channel: 'Total',
          subChannels: validAbuseChannels,
        };
      }

      return {
        universeId,
        channel: validAbuseChannels[0],
      };
    }, [insightsData, universeId]);

  return useApiRequest(makeGetAbuseReportInsightRequest);
};

export default useGetAbuseReportInsight;
