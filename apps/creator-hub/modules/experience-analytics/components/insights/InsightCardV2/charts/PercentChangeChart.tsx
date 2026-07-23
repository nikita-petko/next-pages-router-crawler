import React, { FC } from 'react';
import {
  chartEventLogging,
  PercentChangeInsightCardSpec,
  AnalyticsConfigChart,
} from '@modules/experience-analytics-shared';
import { ChartStyleMode } from '@rbx/analytics-ui';

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
