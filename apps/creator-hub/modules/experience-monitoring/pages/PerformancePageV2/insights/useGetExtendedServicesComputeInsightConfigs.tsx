import { useMemo } from 'react';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import type { RAQIV2UIComponent } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import ExtendedServicesComputeInsightCard from './ExtendedServicesComputeInsightCard';
import useGetExtendedServicesComputeInsight from './useGetExtendedServicesComputeInsight';

/**
 * Returns body components for the Performance > Server tab. When the
 * `INSIGHT_TYPE_EXTENDED_SERVICES_COMPUTE` insight is present for the
 * universe, returns a single `FullWidthLayout` wrapping the recommendation
 * card; otherwise returns an empty array so the tab body is unaffected.
 *
 * Mirrors the `useGetAbuseReportSubmittersInsightConfigs` pattern used by the
 * Safety page.
 */
const useGetExtendedServicesComputeInsightConfigs = (): RAQIV2UIComponent[] => {
  const { data: insight } = useGetExtendedServicesComputeInsight();

  const insightCardConfig = useMemo<ArbitraryComponentConfig | null>(() => {
    if (!insight) {
      return null;
    }
    return {
      type: AnalyticsComponentType.NonGeneric,
      // The card itself doesn't drive any RAQI query, but the framework
      // requires an associated metric for the page-wide control logic. The
      // CPU core utilization metric is the closest analogue and is already
      // declared on the Server tab via `chartConfigPerformanceServerCpuCoreUtilization`.
      metrics: [RAQIV2Metric.CpuCoreUtilization],
      renderer: {
        type: 'isolated',
        render: () => (
          <ExtendedServicesComputeInsightCard
            universeId={insight.universeId}
            snoozeKey={insight.snoozeKey}
          />
        ),
      },
    };
  }, [insight]);

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

export default useGetExtendedServicesComputeInsightConfigs;
