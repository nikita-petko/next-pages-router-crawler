import {
  RAQIV2ChartResource,
  RAQIV2ChartResourceType,
  TRAQIV2BreakdownDimension,
} from '@modules/clients/analytics';
import CreatorDashboardContext from '@modules/eventStream/enum/CreatorDashboardContext';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import type { TrackerClientRequest } from '@modules/eventStream/constants/eventConstants';
import { useRouter } from 'next/router';
import React, {
  FunctionComponent,
  useCallback,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';
import useQueryBasedBreakdownBundle, {
  ExperienceAnalyticsBreakdownBundle,
} from './useQueryBasedBreakdownBundle';
import { useExperienceAnalyticsGameDetails } from './ExperienceAnalyticsGameDetailsProvider';

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
  supportedDimensions: ReadonlyArray<TRAQIV2BreakdownDimension>,
  defaultBreakdown?: ReadonlyArray<TRAQIV2BreakdownDimension>,
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
  supportedDimensions: readonly TRAQIV2BreakdownDimension[],
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
    async (
      oldBreakdown: TRAQIV2BreakdownDimension[],
      newBreakdown: TRAQIV2BreakdownDimension[],
    ) => {
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
