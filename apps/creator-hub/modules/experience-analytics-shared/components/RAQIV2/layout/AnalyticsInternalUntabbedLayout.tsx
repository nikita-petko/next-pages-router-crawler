import type { FC } from 'react';
import React, { useMemo } from 'react';
import GenericFullAnalyticsPageLayout from '../../../layout/GenericFullAnalyticsPageLayout';
import type RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import type { CreatorAnalyticsUntabbedPageConfig } from '../../../types/RAQIV2PageConfig';
import resolveDateRangeSelection from '../../../utils/resolveDateRangeSelection';
import RAQIV2PredefinedPageEligibilityCheckContext from './RAQIV2PredefinedPageEligbilityCheckContext';
import RAQIV2PredefinedSurfaceBody from './RAQIV2PredefinedSurfaceBody';
import useRAQIV2PredefinedPageControlsBundle from './useRAQIV2PredefinedPageControlsBundle';
import useRAQIV2PredefinedPreControlComponentsBundle from './useRAQIV2PredefinedPreControlComponentsBundle';
import useRAQIV2PredefinedPreControlFiltersBundle from './useRAQIV2PredefinedPreControlFiltersBundle';
import useRAQIV2PredefinedSurfaceControlsBundle from './useRAQIV2PredefinedSurfaceControlsBundle';

const AnalyticsInternalUntabbedLayout: FC<{
  config: CreatorAnalyticsUntabbedPageConfig;
}> = ({ config }) => {
  const { title, description } = useRAQIV2PredefinedPageControlsBundle(config);
  const { leftSideControls, rightSideControls, filterDimensions, chartContext } =
    useRAQIV2PredefinedSurfaceControlsBundle(config);
  const preControlChartContext: RAQIV2ChartContext = useMemo(() => {
    if (!config.preControlComponentDateRange) {
      return chartContext;
    }
    return {
      ...chartContext,
      timeSpec: resolveDateRangeSelection(config.preControlComponentDateRange),
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
        action={config.action}
        heroElement={preControlComponent ?? undefined}
        preControlFilters={preControlFilters}
        controls={leftSideControls}
        rightSideControls={rightSideControls}
        raqiDimensions={filterDimensions}
        resource={chartContext.resource}
        filterPositionOverrides={config.filterPositionOverrides}
        addHeroDivider={!config.hideHeroDivider}
        fallbackBanner={config.fallbackBanner}
        additionalBanners={config.additionalBanners}>
        <RAQIV2PredefinedSurfaceBody config={config} chartContext={chartContext} />
      </GenericFullAnalyticsPageLayout>
    </RAQIV2PredefinedPageEligibilityCheckContext>
  );
};
export default AnalyticsInternalUntabbedLayout;
