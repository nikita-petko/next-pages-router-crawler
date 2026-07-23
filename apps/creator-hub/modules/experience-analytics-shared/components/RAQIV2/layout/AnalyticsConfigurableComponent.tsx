import React from 'react';
import { SelectionCallback } from '@rbx/analytics-ui';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import { RAQIV2SpecialLayoutType } from '../../../types/RAQIV2SpecialLayoutConfig';
import RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import { AnalyticsComponentConfig, RAQIV2UIComponent } from '../../../types/RAQIV2PageConfig';
import GenericAnalyticsLayoutItem from './GenericAnalyticsLayoutItem';
import AnalyticsComponent from './AnalyticsComponent';
import AnalyticsSpecialLayoutRenderer from './AnalyticsSpecialLayoutRenderer';

const isComponentKeyOrConfig = (
  component: RAQIV2UIComponent,
): component is AnalyticsComponentConfig => {
  if (typeof component === 'string') return true;
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
}) => {
  if (isComponentKeyOrConfig(component)) {
    return (
      <GenericAnalyticsLayoutItem>
        <AnalyticsComponent
          config={component}
          chartContext={chartContext}
          onSelectChartRegion={onSelectChartRegion}
        />
      </GenericAnalyticsLayoutItem>
    );
  }

  return (
    <AnalyticsSpecialLayoutRenderer
      component={component}
      chartContext={chartContext}
      onSelectChartRegion={onSelectChartRegion}
    />
  );
};

export default AnalyticsConfigurableComponent;
