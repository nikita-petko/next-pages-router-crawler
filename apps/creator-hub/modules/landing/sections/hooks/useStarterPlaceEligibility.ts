import { useEffect, useRef } from 'react';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { useGetLandingEligibility } from '@modules/react-query/creatorHome';

/**
 * Hook that fetches starter place eligibility via CreatorHomeApi and logs
 * experiment exposure via the unified logger when the user is in a control
 * or experiment group.
 *
 * @param isEnabled - When true, we will call creator-home-api to see if the
 * user is eligble for the experiment. No fetch will be made and the hook
 * returns safe defaults.
 */
const useStarterPlaceEligibility = (
  isEnabled: boolean,
): {
  enableStarterPlace: boolean;
  isFetched: boolean;
} => {
  // Never fetch when Studio is supported — the endpoint has side effects that
  // should not be triggered on desktop/compatible devices.
  const { data: eligibility, isFetched } = useGetLandingEligibility(isEnabled);
  const hasLoggedExposureRef = useRef(false);
  const hasLoggedFallthroughRef = useRef(false);

  useEffect(() => {
    if (!isEnabled || !eligibility || hasLoggedExposureRef.current) {
      return;
    }

    if (eligibility.inControlGroup || eligibility.inExperimentGroup) {
      hasLoggedExposureRef.current = true;
      unifiedLoggerClient.logImpressionEvent({
        eventName: 'starterPlaceExperimentExposure',
        parameters: {
          inControlGroup: String(eligibility.inControlGroup),
          inExperimentGroup: String(eligibility.inExperimentGroup),
        },
      });
    }
  }, [eligibility, isEnabled]);

  useEffect(() => {
    if (!isEnabled || !eligibility || hasLoggedFallthroughRef.current) {
      return;
    }

    if (eligibility.controlGroupFallthrough) {
      hasLoggedFallthroughRef.current = true;
      unifiedLoggerClient.logImpressionEvent({
        eventName: 'starterPlaceControlGroupFallthrough',
      });
    }
  }, [eligibility, isEnabled]);

  // When Studio is supported, return safe defaults without having fetched.
  if (!isEnabled) {
    return {
      enableStarterPlace: false,
      isFetched: true,
    };
  }

  return {
    enableStarterPlace: eligibility?.enableStarterPlace ?? false,
    isFetched,
  };
};

export default useStarterPlaceEligibility;
