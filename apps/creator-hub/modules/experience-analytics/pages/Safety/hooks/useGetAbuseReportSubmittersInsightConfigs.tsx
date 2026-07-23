import React, { useMemo } from 'react';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { RAQIV2MetricGranularity, RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import {
  AnalyticsComponentType,
  useUniverseResource,
  RAQIV2SpecialLayoutType,
  RAQIV2UIComponent,
  snapToLatestStartTime,
  snapToLatestEndTime,
  ArbitraryComponentConfig,
} from '@modules/experience-analytics-shared';
import { subDays } from '@rbx/core';
import AbuseReportSubmittersInsightCard from '../components/insight/AbuseReportSubmittersInsightCard';
import useGetAbuseReportSubmittersEligibility from './useGetAbuseReportSubmittersEligibility';
import useGetAbuseReportInsight from './useGetAbuseReportInsight';

const useGetAbuseReportSubmittersInsightConfigs = (): RAQIV2UIComponent[] => {
  const { id: universeId } = useUniverseResource();
  const { data: abuseReportInsight } = useGetAbuseReportInsight();

  const l7TimeSpec = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, 7);
    return {
      startTime: snapToLatestStartTime(startDate, RAQIV2MetricGranularity.OneDay),
      endTime: snapToLatestEndTime(endDate, RAQIV2MetricGranularity.OneDay),
    };
  }, []);

  const eligibilityChartContext = useMemo(
    () => ({
      resource: { type: RAQIV2ChartResourceType.Universe, id: universeId },
      timeSpec: l7TimeSpec,
      granularity: RAQIV2MetricGranularity.OneDay,
      timeAxisBounds: 'disabled' as const,
    }),
    [universeId, l7TimeSpec],
  );

  const eligibilityState = useGetAbuseReportSubmittersEligibility(eligibilityChartContext);

  const insightCardConfig = useMemo(() => {
    if (!abuseReportInsight) {
      return null;
    }

    return {
      type: AnalyticsComponentType.NonGeneric,
      metrics: [RAQIV2Metric.UniqueAbuseReportSubmittersPer1000PlaytimeHours],
      renderer: {
        type: 'isolated',
        render: () => <AbuseReportSubmittersInsightCard {...abuseReportInsight} />,
      },
    } as const satisfies ArbitraryComponentConfig;
  }, [abuseReportInsight]);

  return useMemo(() => {
    if (!insightCardConfig) {
      return [];
    }

    if (typeof eligibilityState === 'boolean' && eligibilityState) {
      return [
        {
          type: RAQIV2SpecialLayoutType.FullWidthLayout,
          items: [insightCardConfig],
        },
      ];
    }

    return [];
  }, [eligibilityState, insightCardConfig]);
};

export default useGetAbuseReportSubmittersInsightConfigs;
