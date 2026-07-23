import React, { Fragment, ReactNode, useMemo } from 'react';
import useOnSelectChartRegion from '../../../hooks/useOnSelectChartRegion';
import RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import { RAQIV2PreControlComponent } from '../../../types/RAQIV2PageConfig';
import AnalyticsConfigurableComponent from './AnalyticsConfigurableComponent';
import getStableKey from '../../../utils/getStableKey';

const useRAQIV2PredefinedPreControlComponentsBundle = (
  preControlComponents: RAQIV2PreControlComponent[],
  context: RAQIV2ChartContext,
) => {
  const onSelectChartRegion = useOnSelectChartRegion();
  const preControlComponent = useMemo(() => {
    const elements: ReactNode[] = preControlComponents.map((component) => {
      return (
        <AnalyticsConfigurableComponent
          key={getStableKey(component)}
          component={component}
          chartContext={context}
          onSelectChartRegion={onSelectChartRegion}
        />
      );
    });
    return elements.length ? <Fragment>{elements}</Fragment> : null;
  }, [context, onSelectChartRegion, preControlComponents]);

  const bundle = useMemo(() => ({ preControlComponent }), [preControlComponent]);

  return bundle;
};

export default useRAQIV2PredefinedPreControlComponentsBundle;
