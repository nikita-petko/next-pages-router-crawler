import React from 'react';
import { ChartStyleMode, SelectionCallback } from '@rbx/analytics-ui';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import getTypedComponentKey from '../../../utils/getTypedComponentKey';
import RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import { AnalyticsComponentConfig } from '../../../types/RAQIV2PageConfig';
import AnalyticsConfigChart from '../AnalyticsConfigChart';
import AnalyticsConfigSummaryCard from '../summaryCards/AnalyticsConfigSummaryCard';
import { AnalyticsArbitraryComponent } from './AnalyticsArbitraryComponent';
import RAQIV2PredefinedControlledSubcontext from '../subcontext/RAQIV2PredefinedControlledSubcontext';
import AnalyticsConfigTabbedChart from '../AnalyticsConfigTabbedChart';
import { getPredefinedChartKey } from '../../../constants/RAQIV2PredefinedChartConfig';
import AnalyticsConfigTable from '../table/AnalyticsConfigTable';
import AnalyticsConfigTabbedTable from '../table/AnalyticsConfigTabbedTable';
import getReactKey from './getReactKey';

type AnalyticsComponentProps = {
  config: AnalyticsComponentConfig;
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion: null | SelectionCallback<number>;
  chartStyleMode?: ChartStyleMode;
  chartControl?: React.JSX.Element | null;
};

const AnalyticsComponent: React.FC<AnalyticsComponentProps> = ({
  config,
  chartContext,
  onSelectChartRegion,
  chartStyleMode,
  chartControl,
}) => {
  const typedComponentKey = getTypedComponentKey(config);
  const { type } = typedComponentKey;

  switch (type) {
    case AnalyticsComponentType.Chart:
      return (
        <AnalyticsConfigChart
          key={`chart-${getReactKey(typedComponentKey.keyOrConfig)}`}
          chartKeyOrConfig={typedComponentKey.keyOrConfig}
          predefinedChartKeyForAssistant={getPredefinedChartKey(typedComponentKey.keyOrConfig)}
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
          chartStyleMode={chartStyleMode}
          chartControl={chartControl}
        />
      );
    case AnalyticsComponentType.TabbedChart:
      return (
        <AnalyticsConfigTabbedChart
          key={`tabbed-chart-${getReactKey(typedComponentKey.keyOrConfig)}`}
          tabbedChartKeyOrConfig={typedComponentKey.keyOrConfig}
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
          chartControl={chartControl}
        />
      );
    case AnalyticsComponentType.Table:
      return (
        <AnalyticsConfigTable
          key={`table-${getReactKey(typedComponentKey.config)}`}
          config={typedComponentKey.config}
          tableContext={chartContext}
          chartControl={chartControl}
        />
      );
    case AnalyticsComponentType.TabbedTable:
      return (
        <AnalyticsConfigTabbedTable
          key={`tabbed-table-${getReactKey(typedComponentKey.config)}`}
          config={typedComponentKey.config}
          chartContext={chartContext}
          chartControl={chartControl}
        />
      );
    case AnalyticsComponentType.SummaryCard:
      return (
        <AnalyticsConfigSummaryCard
          key={`card-${getReactKey(typedComponentKey.config)}`}
          chartContext={chartContext}
          config={typedComponentKey.config}
        />
      );
    case AnalyticsComponentType.NonGeneric:
      return AnalyticsArbitraryComponent(
        typedComponentKey.config,
        chartContext,
        onSelectChartRegion,
      );
    case AnalyticsComponentType.ControlledSubcontext:
      return (
        <RAQIV2PredefinedControlledSubcontext
          key={`subcontext-${getReactKey(typedComponentKey.config)}`}
          config={typedComponentKey.config}
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
        />
      );
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unknown predefined component type ${exhaustiveCheck}`);
    }
  }
};

export default AnalyticsComponent;
