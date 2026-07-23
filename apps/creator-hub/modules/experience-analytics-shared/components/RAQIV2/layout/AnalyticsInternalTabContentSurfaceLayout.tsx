import React from 'react';

import AnalyticsTabContentLayoutV2 from '../../../layout/AnalyticsTabContentLayoutV2';
import computeRAQIV2SpecOverride, { SpecOverride } from '../../../utils/computeRAQIV2SpecOverride';
import { CreatorAnalyticsPageSurfaceConfig } from '../../../types/RAQIV2PageConfig';
import RAQIV2PredefinedSurfaceBody from './RAQIV2PredefinedSurfaceBody';
import useRAQIV2PredefinedSurfaceControlsBundle from './useRAQIV2PredefinedSurfaceControlsBundle';

const AnalyticsInternalTabContentSurfaceLayout = ({
  config,
  specOverride,
}: {
  config: CreatorAnalyticsPageSurfaceConfig;
  specOverride?: SpecOverride;
}) => {
  const { leftSideControls, rightSideControls, filterDimensions, chartContext } =
    useRAQIV2PredefinedSurfaceControlsBundle(config);

  const chartContextOverride = specOverride
    ? computeRAQIV2SpecOverride(chartContext, specOverride)
    : chartContext;

  return (
    <AnalyticsTabContentLayoutV2
      controls={leftSideControls}
      rightSideControls={rightSideControls}
      raqiDimensions={filterDimensions}
      resource={chartContext.resource}>
      <RAQIV2PredefinedSurfaceBody config={config} chartContext={chartContextOverride} />
    </AnalyticsTabContentLayoutV2>
  );
};

export default AnalyticsInternalTabContentSurfaceLayout;
