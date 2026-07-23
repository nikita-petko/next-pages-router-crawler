import React, { FC } from 'react';
import {
  chartEventLogging,
  AdsPerformanceCardSpec,
  AnalyticsConfigChart,
} from '@modules/experience-analytics-shared';
import { ChartStyleMode } from '@rbx/analytics-ui';

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
