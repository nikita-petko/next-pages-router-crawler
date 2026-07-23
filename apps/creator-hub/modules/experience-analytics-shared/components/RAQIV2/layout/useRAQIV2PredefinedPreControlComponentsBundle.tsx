import type { ReactNode } from 'react';
import React, { Fragment, useMemo } from 'react';
import useOnSelectChartRegion from '../../../hooks/useOnSelectChartRegion';
import type RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import type { RAQIV2PreControlComponent } from '../../../types/RAQIV2PageConfig';
import getStableKey from '../../../utils/getStableKey';
import AnalyticsConfigurableComponent from './AnalyticsConfigurableComponent';

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
    return elements.length ? <>{elements}</> : null;
  }, [context, onSelectChartRegion, preControlComponents]);

  const bundle = useMemo(() => ({ preControlComponent }), [preControlComponent]);

  return bundle;
};

export default useRAQIV2PredefinedPreControlComponentsBundle;
