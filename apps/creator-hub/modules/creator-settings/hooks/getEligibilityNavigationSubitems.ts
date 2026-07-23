import { EligibilityType, eligibilityTypes } from '../constants/eligibilityConstants';

export const getEligibilityNavigationSubitems = (showExtendedServices = true) => {
  const subitems = eligibilityTypes.filter(
    (item) => showExtendedServices || item.key !== EligibilityType.ExtendedServices,
  );
  return subitems;
};

export default getEligibilityNavigationSubitems;
