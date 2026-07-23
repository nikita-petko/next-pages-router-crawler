import type { FC } from 'react';
import { ChartStyleMode } from '@rbx/analytics-ui';
import AnalyticsConfigChart from '@modules/experience-analytics-shared/components/RAQIV2/AnalyticsConfigChart';
import {
  chartEventLogging,
  type AdsPerformanceCardSpec,
} from '@modules/experience-analytics-shared/types/insights';

/**
 * Displays a chart showing sponsored ad plays over time.
 */
const AdsPerformanceChart: FC<{ spec: AdsPerformanceCardSpec }> = ({ spec }) => {
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

export default AdsPerformanceChart;
