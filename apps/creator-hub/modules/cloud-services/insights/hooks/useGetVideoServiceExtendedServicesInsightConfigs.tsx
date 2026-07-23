import { useMemo } from 'react';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import type { RAQIV2UIComponent } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import VideoServiceExtendedServicesInsightCard from '../components/VideoServiceExtendedServicesInsightCard';
import useGetVideoServiceExtendedServicesInsight from './useGetVideoServiceExtendedServicesInsight';

/**
 * Returns body components to prepend to the Video Service page. When the
 * `INSIGHT_TYPE_EXTENDED_SERVICES_VIDEO` insight is present for the universe,
 * returns a single `FullWidthLayout` wrapping the recommendation card;
 * otherwise returns an empty array so the page body is unaffected.
 *
 * Mirrors the `useGetExtendedServicesComputeInsightConfigs` pattern used by the
 * Performance > Server tab.
 */
const useGetVideoServiceExtendedServicesInsightConfigs = (): RAQIV2UIComponent[] => {
  const { data: insight } = useGetVideoServiceExtendedServicesInsight();

  const insightCardConfig = useMemo<ArbitraryComponentConfig | null>(() => {
    if (!insight) {
      return null;
    }
    return {
      type: AnalyticsComponentType.NonGeneric,
      // The card doesn't drive a RAQI query, but the framework requires an
      // associated metric for page-wide control logic. Reuse the metric already
      // declared on the Video Service page.
      metrics: [RAQIV2Metric.VideoServiceExclusivePlaybackSeconds],
      renderer: {
        type: 'isolated',
        render: () => (
          <VideoServiceExtendedServicesInsightCard
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

export default useGetVideoServiceExtendedServicesInsightConfigs;
