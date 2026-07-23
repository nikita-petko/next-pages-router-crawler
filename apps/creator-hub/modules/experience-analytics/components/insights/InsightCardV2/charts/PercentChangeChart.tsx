import type { FC } from 'react';
import { ChartStyleMode } from '@rbx/analytics-ui';
import AnalyticsConfigChart from '@modules/experience-analytics-shared/components/RAQIV2/AnalyticsConfigChart';
import {
  chartEventLogging,
  type PercentChangeInsightCardSpec,
} from '@modules/experience-analytics-shared/types/insights';

/**
 * Displays a percent change chart with the comparison line.
 */
const PercentChangeChart: FC<{ spec: PercentChangeInsightCardSpec }> = ({ spec }) => {
  return (
    <AnalyticsConfigChart
      chartStyleMode={ChartStyleMode.Minimal}
      chartKeyOrConfig={spec.chartKey}
      predefinedChartKeyForAssistant={spec.chartKey}
      chartContext={spec.context}
      eventLogging={chartEventLogging}
      onSelectChartRegion={null}
      renderWithoutPeripherals
    />
  );
};

export default PercentChangeChart;
