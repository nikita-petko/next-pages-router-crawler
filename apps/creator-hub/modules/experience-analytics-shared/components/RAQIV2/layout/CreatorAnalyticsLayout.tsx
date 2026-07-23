import React from 'react';
import type { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { CreatorAnalyticsPageConfig } from '../../../types/RAQIV2PageConfig';
import { CreatorAnalyticsPageMode } from '../../../types/RAQIV2PageConfig';
import AnalyticsInternalBreakdownTabLayout from './AnalyticsInternalBreakdownTabLayout';
import AnalyticsInternalEnumTabbedLayout from './AnalyticsInternalEnumTabbedLayout';
import AnalyticsInternalTabContentSurfaceLayout from './AnalyticsInternalTabContentSurfaceLayout';
import AnalyticsInternalUntabbedLayout from './AnalyticsInternalUntabbedLayout';
import { RAQIV2ConfigurablePageSurfaceContextProvider } from './RAQIV2ConfigurablePageContext';

/**
 * Main layout component for Creator Analytics pages. This component sets up the necessary
 * context providers and renders the appropriate internal layout component based on the config mode.
 *
 * IMPORTANT: Always use this component instead of the internal layout components directly.
 * The internal components (AnalyticsInternal*Layout) require the RAQIV2ConfigurablePageSurfaceContextProvider
 * context which this component provides.
 *
 * This component now also integrates with the two-layer analytics context architecture:
 * - Layer 1 (RawAnalyticsQueryParamsProvider) is provided by the page wrapper
 * - Layer 2 (PageConfigAwareAnalyticsProvider) is provided here based on the page config
 */
export default function CreatorAnalyticsLayout<
  TTab extends string,
  TDim extends RAQIV2Dimension,
  TDimValues extends string,
>({
  config,
  preControlComponentHack,
}: {
  config: CreatorAnalyticsPageConfig<TTab, TDim, TDimValues>;
  preControlComponentHack?: React.JSX.Element; // TODO(gperkins@20240521): DSA-2360 remove
}) {
  const { mode } = config;

  return (
    <RAQIV2ConfigurablePageSurfaceContextProvider config={config}>
      {(() => {
        switch (mode) {
          case CreatorAnalyticsPageMode.Embedded:
            return <AnalyticsInternalTabContentSurfaceLayout config={config} />;
          case CreatorAnalyticsPageMode.FixedTab:
            return (
              <AnalyticsInternalEnumTabbedLayout
                config={config}
                preControlComponentHack={preControlComponentHack}
              />
            );
          case CreatorAnalyticsPageMode.BreakdownTab:
            return <AnalyticsInternalBreakdownTabLayout config={config} />;
          case CreatorAnalyticsPageMode.Untabbed:
            return <AnalyticsInternalUntabbedLayout config={config} />;
          default: {
            const exhaustiveCheck: never = mode;
            throw new Error(`Unhandled mode: ${exhaustiveCheck}`);
          }
        }
      })()}
    </RAQIV2ConfigurablePageSurfaceContextProvider>
  );
}
