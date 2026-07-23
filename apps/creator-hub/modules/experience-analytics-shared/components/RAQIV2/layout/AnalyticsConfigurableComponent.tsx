import React from 'react';
import type { SelectionCallback } from '@rbx/analytics-ui';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { RAQIV2ChartUpdatePolicy } from '../../../types/GenericRAQIV2ChartProps';
import type RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import type { AnalyticsComponentConfig, RAQIV2UIComponent } from '../../../types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '../../../types/RAQIV2SpecialLayoutConfig';
import AnalyticsComponent from './AnalyticsComponent';
import AnalyticsSpecialLayoutRenderer from './AnalyticsSpecialLayoutRenderer';
import GenericAnalyticsLayoutItem from './GenericAnalyticsLayoutItem';

const isComponentKeyOrConfig = (
  component: RAQIV2UIComponent,
): component is AnalyticsComponentConfig => {
  if (typeof component === 'string') {
    return true;
  }
  const { type } = component;
  if (isValidEnumValue(RAQIV2SpecialLayoutType, type)) {
    return false;
  }
  // If it's not a special layout type, it must be a component config
  return true;
};

type AnalyticsConfigurableComponentProps = {
  component: RAQIV2UIComponent;
  chartContext: RAQIV2ChartContext;
  onSelectChartRegion: null | SelectionCallback<number>;
  chartUpdatePolicy?: RAQIV2ChartUpdatePolicy;
  /**
   * Grid item layout for leaf components. Defaults to the page-level responsive
   * one-/two-column layout. Hosts that already size the cell (e.g. custom
   * dashboard editor mounts) should pass {@link RAQIV2SpecialLayoutType.FullWidthLayout}.
   */
  layout?: RAQIV2SpecialLayoutType;
};

/**
 * The DEFAULT behaviour when no RAQIV2SpecialLayoutType is specified is to arrange components into a
 * responsive one- or two-column layout based on the page width (i.e. ResponsiveOneOrTwoColumnLayout).
 *
 * The components themselves assume the behaviour of acting fullWidth inside their own container. This component
 * is called by the layout/page-content components who are responsible dictating the layout of the charts.
 *
 * Due to these reasons, we wrap the result of AnalyticsComponentRenderer in a responsive grid item.
 */
const AnalyticsConfigurableComponent: React.FC<AnalyticsConfigurableComponentProps> = ({
  component,
  chartContext,
  onSelectChartRegion,
  chartUpdatePolicy,
  layout,
}) => {
  if (isComponentKeyOrConfig(component)) {
    return (
      <GenericAnalyticsLayoutItem layout={layout}>
        <AnalyticsComponent
          config={component}
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
          chartUpdatePolicy={chartUpdatePolicy}
        />
      </GenericAnalyticsLayoutItem>
    );
  }

  return (
    <AnalyticsSpecialLayoutRenderer
      component={component}
      chartContext={chartContext}
      onSelectChartRegion={onSelectChartRegion}
      chartUpdatePolicy={chartUpdatePolicy}
    />
  );
};

export default AnalyticsConfigurableComponent;
