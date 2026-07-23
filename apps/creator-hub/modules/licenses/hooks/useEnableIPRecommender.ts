import { IXPLayers, LicenseManagerParameters } from '@modules/clients/ixpExperiments';
import { useIXPParameters } from '@modules/miscellaneous/hooks';

const useEnableIPRecommender = () => {
  const { isFetched, params } = useIXPParameters(IXPLayers.LicenseManager);

  return {
    isFetched,
    isEnabled: isFetched && params[LicenseManagerParameters.EnableIPRecommender] === true,
  };
};

export default useEnableIPRecommender;
