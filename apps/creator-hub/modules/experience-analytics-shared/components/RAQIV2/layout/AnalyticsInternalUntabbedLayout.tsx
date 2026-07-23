import React, { FC, useMemo } from 'react';
import calculateTimeRangeFromSpec from '../../../utils/calculateTimeRangeFromSpec';
import RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import GenericFullAnalyticsPageLayout from '../../../layout/GenericFullAnalyticsPageLayout';
import { CreatorAnalyticsUntabbedPageConfig } from '../../../types/RAQIV2PageConfig';
import useRAQIV2PredefinedSurfaceControlsBundle from './useRAQIV2PredefinedSurfaceControlsBundle';
import useRAQIV2PredefinedPageControlsBundle from './useRAQIV2PredefinedPageControlsBundle';
import RAQIV2PredefinedSurfaceBody from './RAQIV2PredefinedSurfaceBody';
import RAQIV2PredefinedPageEligibilityCheckContext from './RAQIV2PredefinedPageEligbilityCheckContext';
import useRAQIV2PredefinedPreControlFiltersBundle from './useRAQIV2PredefinedPreControlFiltersBundle';
import useRAQIV2PredefinedPreControlComponentsBundle from './useRAQIV2PredefinedPreControlComponentsBundle';

const AnalyticsInternalUntabbedLayout: FC<{
  config: CreatorAnalyticsUntabbedPageConfig;
}> = ({ config }) => {
  const { title, description } = useRAQIV2PredefinedPageControlsBundle(config);
  const { leftSideControls, rightSideControls, filterDimensions, chartContext } =
    useRAQIV2PredefinedSurfaceControlsBundle(config);
  const preControlChartContext: RAQIV2ChartContext = useMemo(() => {
    if (!config.preControlComponentDateRange) return chartContext;
    const { startTime, endTime } = calculateTimeRangeFromSpec(config.preControlComponentDateRange);
    return {
      ...chartContext,
      timeSpec: {
        ...chartContext.timeSpec,
        startTime,
        endTime,
      },
    };
  }, [config.preControlComponentDateRange, chartContext]);
  const { preControlComponent } = useRAQIV2PredefinedPreControlComponentsBundle(
    config.preControlCharts ?? [],
    preControlChartContext,
  );
  const { preControlFilters } = useRAQIV2PredefinedPreControlFiltersBundle(
    config.resourceTypes,
    filterDimensions,
    config.preControlComponentDateRange,
  );

  return (
    <RAQIV2PredefinedPageEligibilityCheckContext config={config}>
      <GenericFullAnalyticsPageLayout
        title={title}
        description={description}
        heroElement={preControlComponent || undefined}
        preControlFilters={preControlFilters}
        controls={leftSideControls}
        rightSideControls={rightSideControls}
        raqiDimensions={filterDimensions}
        resource={chartContext.resource}
        addHeroDivider={!config.hideHeroDivider}
        additionalBanners={config.additionalBanners}>
        <RAQIV2PredefinedSurfaceBody config={config} chartContext={chartContext} />
      </GenericFullAnalyticsPageLayout>
    </RAQIV2PredefinedPageEligibilityCheckContext>
  );
};
export default AnalyticsInternalUntabbedLayout;
