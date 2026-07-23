import React from 'react';
import type { ChartStyleMode, SelectionCallback } from '@rbx/analytics-ui';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { ChartLocation } from '@modules/charts-generic/context/ChartLocation';
import type { RAQIV2SummarySpec } from '../../../adapters/genericRAQIV2ChartSummaryAdapter';
import { getPredefinedChartKey } from '../../../constants/RAQIV2PredefinedChartConfig';
import type { RAQIV2ChartUpdatePolicy } from '../../../types/GenericRAQIV2ChartProps';
import type RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import type { AnalyticsComponentConfig } from '../../../types/RAQIV2PageConfig';
import getTypedComponentKey from '../../../utils/getTypedComponentKey';
import AnalyticsConfigChart from '../AnalyticsConfigChart';
import AnalyticsConfigTabbedChart from '../AnalyticsConfigTabbedChart';
import type { RAQIV2PredefinedControlledSubcontextProps } from '../subcontext/types';
import AnalyticsConfigSummaryCard from '../summaryCards/AnalyticsConfigSummaryCard';
import AnalyticsConfigTabbedTable from '../table/AnalyticsConfigTabbedTable';
import AnalyticsConfigTable from '../table/AnalyticsConfigTable';
import { renderAnalyticsArbitraryComponent } from './AnalyticsArbitraryComponent';
import getReactKey from './getReactKey';

export type RecursiveAnalyticsComponentProps = {
  config: AnalyticsComponentConfig;
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion: null | SelectionCallback<number>;
  chartStyleMode?: ChartStyleMode;
  chartUpdatePolicy?: RAQIV2ChartUpdatePolicy;
  chartControl?: React.JSX.Element | null;
  breakdownSummaryFilterOverride?: RAQIV2SummarySpec['breakdownSummaryFilter'];
  chartLocation?: ChartLocation;
  subcontextComponent: React.ComponentType<RAQIV2PredefinedControlledSubcontextProps>;
};

const RecursiveAnalyticsComponent: React.FC<RecursiveAnalyticsComponentProps> = ({
  config,
  chartContext,
  onSelectChartRegion,
  chartStyleMode,
  chartUpdatePolicy,
  chartControl,
  breakdownSummaryFilterOverride,
  chartLocation,
  subcontextComponent: SubcontextComponent,
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
          chartUpdatePolicy={chartUpdatePolicy}
          chartControl={chartControl}
          breakdownSummaryFilterOverride={breakdownSummaryFilterOverride}
          chartLocation={chartLocation}
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
          chartLocation={chartLocation}
          chartUpdatePolicy={chartUpdatePolicy}
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
      return renderAnalyticsArbitraryComponent(
        typedComponentKey.config,
        chartContext,
        onSelectChartRegion,
      );
    case AnalyticsComponentType.ControlledSubcontext:
      return (
        <SubcontextComponent
          key={`subcontext-${getReactKey(typedComponentKey.config)}`}
          config={typedComponentKey.config}
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
          chartLocation={chartLocation}
          chartUpdatePolicy={chartUpdatePolicy}
        />
      );
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unknown predefined component type ${String(exhaustiveCheck)}`);
    }
  }
};

export default RecursiveAnalyticsComponent;
