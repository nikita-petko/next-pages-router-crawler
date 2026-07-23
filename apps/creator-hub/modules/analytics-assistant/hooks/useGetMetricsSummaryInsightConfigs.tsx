import { useMemo } from 'react';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { ResourceType } from '@rbx/client-universe-analytics-insights/v1';
import { subDays } from '@rbx/core';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useGenerateMetricsSummary } from '@modules/react-query/universeAnalyticsInsights';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import {
  useUniverseResource,
  RAQIV2SpecialLayoutType,
  CreatorAnalyticsPageConfig,
  RAQIV2UIComponent,
  ArbitraryComponentConfig,
  CreatorAnalyticsPageMode,
} from '@modules/experience-analytics-shared';
import MetricsSummaryInsightCard from '../components/insights/MetricsSummaryInsightCard';
import buildMetricsSummaryInput from '../utils/buildMetricsSummaryInput';
import { adaptMetricsSummaryReport } from '../adapters/adaptSummaryReportInsight';

const useGetMetricsSummaryInsightConfigs = <
  TTab extends string,
  TDim extends RAQIV2Dimension,
  TDimValues extends string,
>(
  config: CreatorAnalyticsPageConfig<TTab, TDim, TDimValues>,
): RAQIV2UIComponent[] => {
  const { id: universeId } = useUniverseResource();
  const { isMetricsSummaryInsightEnabled } = useFeatureFlagsForNamespace(
    'isMetricsSummaryInsightEnabled',
    FeatureFlagNamespace.Analytics,
  );

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 56);
    return {
      startDate: start,
      endDate: end,
    };
  }, []);

  const metricsSummaryInput = useMemo(() => {
    return buildMetricsSummaryInput(
      config,
      config.debugPageName ?? '',
      startDate,
      endDate,
      ResourceType.Universe,
      universeId.toString(),
    );
  }, [config, startDate, endDate, universeId]);

  const { data: insight } = useGenerateMetricsSummary(
    universeId,
    metricsSummaryInput,
    isMetricsSummaryInsightEnabled,
  );

  const insightCardConfig = useMemo(() => {
    // Only render for configs that are not embedded surfaces
    if (config.mode === CreatorAnalyticsPageMode.Embedded || !insight) {
      return null;
    }

    const spec = adaptMetricsSummaryReport(insight);
    if (!spec) {
      return null;
    }
    const { insightId, report, snoozeKey } = spec;

    return {
      type: AnalyticsComponentType.NonGeneric,
      metrics: [],
      renderer: {
        type: 'isolated',
        render: () => (
          <MetricsSummaryInsightCard
            debugPageName={config.debugPageName ?? ''}
            title={config.title}
            insightId={insightId}
            report={report}
            snoozeKey={snoozeKey}
          />
        ),
      },
    } as const satisfies ArbitraryComponentConfig;
  }, [insight, config]);

  return useMemo(() => {
    if (!insightCardConfig) {
      return [];
    }

    return [
      {
        type: RAQIV2SpecialLayoutType.FullWidthLayout,
        items: [insightCardConfig],
      },
    ];
  }, [insightCardConfig]);
};

export default useGetMetricsSummaryInsightConfigs;
