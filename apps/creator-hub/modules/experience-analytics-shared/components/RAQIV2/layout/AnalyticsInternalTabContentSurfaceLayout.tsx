import React, { useMemo, useState } from 'react';
import AnalyticsTabContentLayoutV2 from '../../../layout/AnalyticsTabContentLayoutV2';
import type { CreatorAnalyticsPageSurfaceConfig } from '../../../types/RAQIV2PageConfig';
import type { SpecOverride } from '../../../utils/computeRAQIV2SpecOverride';
import computeRAQIV2SpecOverride from '../../../utils/computeRAQIV2SpecOverride';
import { RAQIV2ControlledSubcontextSelectionProvider } from '../subcontext/RAQIV2ControlledSubcontextSelectionContext';
import RAQIV2PredefinedSurfaceBody from './RAQIV2PredefinedSurfaceBody';
import useRAQIV2PredefinedSurfaceControlsBundle from './useRAQIV2PredefinedSurfaceControlsBundle';

const AnalyticsInternalTabContentSurfaceLayout = ({
  config,
  specOverride,
}: {
  config: CreatorAnalyticsPageSurfaceConfig;
  specOverride?: SpecOverride;
}) => {
  const { surfaceViewSelector } = config;
  const defaultViewKey = surfaceViewSelector?.defaultViewKey ?? '';
  const [selectedViewKey, setSelectedViewKey] = useState(defaultViewKey);

  const selectedConfig = useMemo(() => {
    if (!surfaceViewSelector) {
      return config;
    }
    return {
      ...config,
      body: surfaceViewSelector.getBodyForView(selectedViewKey),
    };
  }, [config, selectedViewKey, surfaceViewSelector]);

  const { leftSideControls, rightSideControls, filterDimensions, chartContext } =
    useRAQIV2PredefinedSurfaceControlsBundle(selectedConfig);

  const chartContextOverride = specOverride
    ? computeRAQIV2SpecOverride(chartContext, specOverride)
    : chartContext;

  const preControlContent = surfaceViewSelector?.renderViewSelector({
    selectedViewKey,
    onSelectViewKey: setSelectedViewKey,
  });

  return (
    <AnalyticsTabContentLayoutV2
      controls={leftSideControls}
      rightSideControls={rightSideControls}
      preControlContent={preControlContent}
      raqiDimensions={filterDimensions}
      resource={chartContext.resource}
      filterPositionOverrides={selectedConfig.filterPositionOverrides}>
      <RAQIV2ControlledSubcontextSelectionProvider>
        <RAQIV2PredefinedSurfaceBody config={selectedConfig} chartContext={chartContextOverride} />
      </RAQIV2ControlledSubcontextSelectionProvider>
    </AnalyticsTabContentLayoutV2>
  );
};

export default AnalyticsInternalTabContentSurfaceLayout;
