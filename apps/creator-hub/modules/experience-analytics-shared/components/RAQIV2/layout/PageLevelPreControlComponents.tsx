import type { ReactNode } from 'react';
import React, { Fragment, useMemo } from 'react';
import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { useUniverseResource } from '../../../hooks/useChartResourceProvider';
import useOnSelectChartRegion from '../../../hooks/useOnSelectChartRegion';
import type RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import type { RAQIV2PreControlComponent } from '../../../types/RAQIV2PageConfig';
import { isRAQIV2SpecialLayoutConfig } from '../../../types/RAQIV2SpecialLayoutConfig';
import getStableKey from '../../../utils/getStableKey';
import { renderAnalyticsArbitraryComponent } from './AnalyticsArbitraryComponent';
import AnalyticsSpecialLayoutRenderer from './AnalyticsSpecialLayoutRenderer';

/**
 * Renders page-level `preControlCharts` — pre-control components declared on
 * {@link RAQIV2PageConfig} rather than on a per-surface config. Unlike the
 * per-surface hook ({@link useRAQIV2PredefinedPreControlComponentsBundle}),
 * these components may render without a real chart context (e.g. when the page
 * is ineligible), so we use a best-effort mock context built from the universe
 * resource. Isolated renderers ignore the context entirely; `withChartContext`
 * renderers receive the mock and should be used sparingly here.
 */
const PageLevelPreControlComponents: React.FC<{
  preControlComponents: RAQIV2PreControlComponent[];
}> = ({ preControlComponents }) => {
  const onSelectChartRegion = useOnSelectChartRegion();
  const resource = useUniverseResource();
  const mockChartContext = useMemo<RAQIV2ChartContext>(
    () => ({
      resource,
      timeSpec: {
        rangeType: RAQIV2DateRangeType.Custom,
        startTime: new Date(),
        endTime: new Date(),
      },
      granularity: RAQIV2MetricGranularity.OneDay,
      timeAxisBounds: null,
    }),
    [resource],
  );

  const rendered = useMemo<ReactNode>(() => {
    const elements = preControlComponents.map((component) => {
      if (isRAQIV2SpecialLayoutConfig(component)) {
        return (
          <AnalyticsSpecialLayoutRenderer
            key={getStableKey(component)}
            component={component}
            chartContext={mockChartContext}
            onSelectChartRegion={onSelectChartRegion}
          />
        );
      }
      return (
        <Fragment key={getStableKey(component)}>
          {renderAnalyticsArbitraryComponent(component, mockChartContext, onSelectChartRegion)}
        </Fragment>
      );
    });
    return elements.length ? <>{elements}</> : null;
  }, [mockChartContext, onSelectChartRegion, preControlComponents]);

  return rendered;
};

export default PageLevelPreControlComponents;
