import { useMemo } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import { useSettings } from '@modules/settings';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { isValidTemplateId } from '@modules/home/utils/createYourPlaceUtils';
import useStarterPlaceEligibility from './useStarterPlaceEligibility';

/**
 * Combines all starter place eligibility checks into a single hook:
 * - userId (user must be authenticated)
 * - `enableStarterPlaceEligibility` setting
 * - IXP override for Roblox employees via StarterPlaceCreation layer
 */
const useStarterPlace = (): {
  enableStarterPlace: boolean;
  starterPlaceTemplateId: number;
  isFetched: boolean;
} => {
  const { user } = useAuthentication();
  const userId = user?.id;
  const {
    settings: { enableStarterPlaceEligibility, starterPlaceTemplateId },
  } = useSettings();

  // IXP override for Roblox employees; legacy behavior was to enable if the
  // starter place template id was set in the IXP layer.
  // This is only used to determin the override behavior
  const {
    params: { starterPlaceTemplateId: starterPlaceTemplateIdIXP },
    isFetched: isFetchedStarterPlaceCreation,
  } = useIXPParameters(IXPLayers.StarterPlaceCreation, { restoreInitialValueFromCache: true });
  const enableStarterPlaceFromOverride = useMemo(
    () =>
      enableStarterPlaceEligibility &&
      isFetchedStarterPlaceCreation &&
      isValidTemplateId(starterPlaceTemplateIdIXP),
    [enableStarterPlaceEligibility, isFetchedStarterPlaceCreation, starterPlaceTemplateIdIXP],
  );

  // This is the actual eligibility check for the starter place experiment
  const { enableStarterPlace: enableStarterPlaceFromEligibility, isFetched: isFetchedEligibility } =
    useStarterPlaceEligibility(!!userId && enableStarterPlaceEligibility);

  const enableStarterPlace =
    isValidTemplateId(starterPlaceTemplateId) &&
    (enableStarterPlaceFromEligibility || enableStarterPlaceFromOverride);
  // If enableStarterPlaceEligibility is false, we're not fetching anything, so isFetched is true
  // this "isFetched" flag is used downstream in various ways, so we need to be careful about what we return
  const isFetched = enableStarterPlaceEligibility
    ? isFetchedEligibility && isFetchedStarterPlaceCreation
    : true;

  return {
    enableStarterPlace,
    starterPlaceTemplateId,
    isFetched,
  };
};

export default useStarterPlace;
