import { EligibilityType, eligibilityTypes } from '../constants/eligibilityConstants';

export const getEligibilityNavigationSubitems = (
  showAudioDistribution: boolean = true,
  showExtendedServices: boolean = true,
  showPublicPublish: boolean = true,
  showPublishingPermissions: boolean = false,
) => {
  const subitems = eligibilityTypes.filter(
    (item) =>
      (showAudioDistribution || item.key !== EligibilityType.AudioDistribution) &&
      (showExtendedServices || item.key !== EligibilityType.ExtendedServices) &&
      (showPublicPublish || item.key !== EligibilityType.PublicPublish) &&
      (showPublishingPermissions || item.key !== EligibilityType.PublishingPermissions),
  );
  return subitems;
};

export default getEligibilityNavigationSubitems;
