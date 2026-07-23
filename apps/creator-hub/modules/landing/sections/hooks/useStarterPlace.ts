import { IXPLayers } from '@modules/clients/ixpExperiments';
import { isValidTemplateId } from '@modules/home/utils/createYourPlaceUtils';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useStarterPlaceEligibility from './useStarterPlaceEligibility';

/**
 * Combines all starter place eligibility checks into a single hook:
 * - IXP override for Roblox employees via StarterPlaceCreation layer
 */
const useStarterPlace = (): {
  enableStarterPlace: boolean;
  starterPlaceTemplateId: number;
  isFetched: boolean;
} => {
  const {
    settings: { starterPlaceTemplateId },
  } = useSettings();

  // IXP override for Roblox employees; legacy behavior was to enable if the
  // starter place template id was set in the IXP layer.
  // This is only used to determin the override behavior
  const {
    params: { starterPlaceTemplateId: starterPlaceTemplateIdIXP },
    isFetched: isFetchedStarterPlaceCreation,
  } = useIXPParameters(IXPLayers.StarterPlaceCreation, { restoreInitialValueFromCache: true });
  const enableStarterPlaceFromOverride =
    isFetchedStarterPlaceCreation && isValidTemplateId(starterPlaceTemplateIdIXP);

  // This is the actual eligibility check for the starter place experiment.
  // The experiment failed, so it is permanently disabled.
  const { enableStarterPlace: enableStarterPlaceFromEligibility, isFetched: isFetchedEligibility } =
    useStarterPlaceEligibility(false);

  const enableStarterPlace =
    isValidTemplateId(starterPlaceTemplateId) &&
    (enableStarterPlaceFromEligibility || enableStarterPlaceFromOverride);
  const isFetched = isFetchedEligibility && isFetchedStarterPlaceCreation;

  return {
    enableStarterPlace,
    starterPlaceTemplateId,
    isFetched,
  };
};

export default useStarterPlace;
