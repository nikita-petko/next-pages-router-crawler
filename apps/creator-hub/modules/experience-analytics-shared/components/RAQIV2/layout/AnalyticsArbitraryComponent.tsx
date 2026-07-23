import React from 'react';
import { SelectionCallback } from '@rbx/analytics-ui';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';

export type ArbitraryComponentConfig = {
  type: AnalyticsComponentType.NonGeneric;

  /**
   * We need to know which metrics the component will be using, if any.
   * This is used in page-wide control logic.
   */
  metrics: RAQIV2Metric[];

  renderer:
    | {
        type: 'isolated';
        render: () => React.ReactNode;
      }
    | {
        type: 'withChartContext';
        render: (
          /**
           * CAUTION(gperkins@20250527): Use this dynamic renderer sparingly.
           * The chart context is faked for these non-generic components.
           * See DangerousPreControlComponent for implementation details.
           */
          chartContext: RAQIV2ChartContext,
          onSelectChartRegion: null | SelectionCallback<number>,
        ) => React.ReactNode;
      };
};

export type ArbitraryComponentConfigOrPredefinedKey = ArbitraryComponentConfig;

export const AnalyticsArbitraryComponent = (
  config: ArbitraryComponentConfig,
  chartContext: RAQIV2ChartContext,
  onSelectChartRegion: null | SelectionCallback<number>,
) => {
  if (config.renderer.type === 'isolated') {
    return config.renderer.render();
  }
  if (config.renderer.type === 'withChartContext') {
    return config.renderer.render(chartContext, onSelectChartRegion);
  }
  // eslint-disable-next-line testing-library/render-result-naming-convention -- this is not a render result
  const exhaustiveCheck: never = config.renderer;
  throw new Error(`Unhandled component: ${exhaustiveCheck}`);
};
