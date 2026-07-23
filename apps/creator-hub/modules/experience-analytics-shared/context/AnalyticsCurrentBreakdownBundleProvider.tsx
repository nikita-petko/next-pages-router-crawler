import type { FunctionComponent } from 'react';
import React, { useCallback, createContext, useContext, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { ChartResource as RAQIV2ChartResource } from '@modules/clients/analytics/analyticsRAQIShared';
import { ChartResourceType as RAQIV2ChartResourceType } from '@modules/clients/analytics/analyticsRAQIShared';
import type { TrackerClientRequest } from '@modules/eventStream/constants/eventConstants';
import CreatorDashboardContext from '@modules/eventStream/enum/CreatorDashboardContext';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { useExperienceAnalyticsGameDetails } from './ExperienceAnalyticsGameDetailsProvider';
import type { ExperienceAnalyticsBreakdownBundle } from './useQueryBasedBreakdownBundle';
import useQueryBasedBreakdownBundle from './useQueryBasedBreakdownBundle';

const setBreakdown = async () => {};

export const DefaultAnalyticsCurrentBreakdownContext = {
  breakdown: [],
  setBreakdown,
};

// Exported so that Layer 2 (PageConfigAwareBreakdownProvider) can provide to this same context
export const AnalyticsCurrentBreakdownContext = createContext<ExperienceAnalyticsBreakdownBundle>(
  DefaultAnalyticsCurrentBreakdownContext,
);
AnalyticsCurrentBreakdownContext.displayName = 'ExperienceAnalyticsCurrentBreakdown';

export const useAnalyticsCurrentBreakdownBundleUnfiltered = () => {
  return useContext(AnalyticsCurrentBreakdownContext);
};

export const useAnalyticsCurrentBreakdownBundleAndSetDefaults = (
  supportedDimensions: ReadonlyArray<TRAQIV2Dimension>,
  defaultBreakdown?: ReadonlyArray<TRAQIV2Dimension>,
) => {
  const [isInitialization, setIsInitialization] = useState<boolean>(true);
  const { breakdown, setBreakdown: setBreakdownFromContext } = useContext(
    AnalyticsCurrentBreakdownContext,
  );
  // TODO(gperkins@20240905): DSA-3216 fix defaults using a proxy page context provider
  if (isInitialization && defaultBreakdown && !breakdown?.length) {
    setBreakdownFromContext([...defaultBreakdown]);
    setIsInitialization(false);
  }
  return useMemo(() => {
    return {
      breakdown: breakdown.filter((dimension) => supportedDimensions.includes(dimension)),
      setBreakdown: setBreakdownFromContext,
    };
  }, [breakdown, setBreakdownFromContext, supportedDimensions]);
};

export const useAnalyticsCurrentBreakdownBundle = (
  supportedDimensions: readonly TRAQIV2Dimension[],
) => {
  const { breakdown, setBreakdown: setBreakdownFromContext } = useContext(
    AnalyticsCurrentBreakdownContext,
  );
  return useMemo(() => {
    return {
      breakdown: breakdown.filter((dimension) => supportedDimensions.includes(dimension)),
      setBreakdown: setBreakdownFromContext,
    };
  }, [breakdown, setBreakdownFromContext, supportedDimensions]);
};

const AnalyticsCurrentBreakdownBundleProvider: FunctionComponent<
  React.PropsWithChildren<{
    resource: RAQIV2ChartResource;
  }>
> = ({ children, resource }) => {
  const { trackerClient } = useEventTrackerProvider();
  const router = useRouter();
  const { universeId } = useExperienceAnalyticsGameDetails();

  const logBreakdownChange = useCallback(
    async (oldBreakdown: TRAQIV2Dimension[], newBreakdown: TRAQIV2Dimension[]) => {
      const trackerClientRequest: TrackerClientRequest = {
        eventType: CreatorDashboardEventType.DataDivisionChanged,
        context: CreatorDashboardContext.Click,
        additionalProperties: {
          Source: router.route,
          Current: oldBreakdown.join(','),
          Selected: newBreakdown.join(','),
          UniverseId: resource.type === RAQIV2ChartResourceType.Universe ? universeId : '', // TODO: jjuang: This is for legacy compatibility. Remove after fully migrated to RAQIV2
          ResourceId: resource.id,
          ResourceType: resource.type.toString(),
        },
      };

      trackerClient.sendEvent(trackerClientRequest);
    },
    [router.route, resource.type, resource.id, universeId, trackerClient],
  );

  const breakdownContextBundle = useQueryBasedBreakdownBundle(logBreakdownChange);
  return (
    <AnalyticsCurrentBreakdownContext.Provider value={breakdownContextBundle}>
      {children}
    </AnalyticsCurrentBreakdownContext.Provider>
  );
};
export default AnalyticsCurrentBreakdownBundleProvider;
