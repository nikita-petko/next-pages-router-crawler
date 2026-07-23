import type { FC, ReactNode } from 'react';
import React, { useMemo } from 'react';
import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { useBestSupportedChartResourceOfTypes } from '../../../hooks/useChartResourceProvider';
import useOnSelectChartRegion from '../../../hooks/useOnSelectChartRegion';
import type { RAQIV2PreControlComponent } from '../../../types/RAQIV2PageConfig';
import { isRAQIV2SpecialLayoutConfig } from '../../../types/RAQIV2SpecialLayoutConfig';
import { renderAnalyticsArbitraryComponent } from './AnalyticsArbitraryComponent';
import AnalyticsSpecialLayoutRenderer from './AnalyticsSpecialLayoutRenderer';

const DangerousPreControlComponent: FC<{
  component: RAQIV2PreControlComponent;
  resourceTypes: RAQIV2ChartResourceType[];
}> = ({ component, resourceTypes }) => {
  const onSelectChartRegion = useOnSelectChartRegion();
  const bestEffortMaybeMockChartResource = useBestSupportedChartResourceOfTypes(resourceTypes);
  const bestEffortMockChartContext = useMemo(
    () => ({
      resource: bestEffortMaybeMockChartResource,
      timeSpec: {
        rangeType: RAQIV2DateRangeType.Custom,
        startTime: new Date(),
        endTime: new Date(),
      },
      granularity: RAQIV2MetricGranularity.OneDay,
      timeAxisBounds: null,
    }),
    [bestEffortMaybeMockChartResource],
  );
  if (isRAQIV2SpecialLayoutConfig(component)) {
    return (
      <AnalyticsSpecialLayoutRenderer
        component={component}
        chartContext={bestEffortMockChartContext}
        onSelectChartRegion={onSelectChartRegion}
      />
    );
  }
  return renderAnalyticsArbitraryComponent(
    component,
    bestEffortMockChartContext,
    onSelectChartRegion,
  );
};

/**
 * Most charts can't render properly in this context because we don't have the chart context.
 *
 * Since we still currently require contexts for AnalyticsComponentType.NonGeneric components,
 * this dangerously does a best-effort construction of a bad chartContext.
 *
 * TODO(gperkins@20240813): DSA-2650 -- We should change AnalyticsComponentType.NonGeneric renderers
 * not to require a chart context, and make the hourly monetization chart a proper chart.
 * But then, if we want to open this up to all AnalyticsComponentConfig,
 * we will need to include some directive alongside the preControlCharts array
 * to indicate how we should build the context.
 */
const useDangerousRAQIV2PredefinedPreControlComponentsBundle = (
  preControlComponents: RAQIV2PreControlComponent[],
  resourceTypes: RAQIV2ChartResourceType[],
) => {
  const preControlComponent = useMemo(() => {
    const elements: ReactNode[] = preControlComponents.map((component, idx) => {
      return (
        <DangerousPreControlComponent
          key={typeof component === 'string' ? component : `pre-control-${idx}`}
          component={component}
          resourceTypes={resourceTypes}
        />
      );
    });
    return elements.length ? <>{elements}</> : null;
  }, [preControlComponents, resourceTypes]);

  const bundle = useMemo(() => ({ preControlComponent }), [preControlComponent]);

  return bundle;
};

export default useDangerousRAQIV2PredefinedPreControlComponentsBundle;
