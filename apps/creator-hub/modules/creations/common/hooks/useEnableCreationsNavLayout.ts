import { CreatorHubNavigationUserParameters, IXPLayers } from '@modules/clients/ixpExperiments';
import { useIXPParameters } from '@modules/miscellaneous/hooks';

const useEnableCreationsNavLayout = () => {
  const { params: ixpParams } = useIXPParameters(IXPLayers.CreatorHubNavigationUser, {
    restoreInitialValueFromCache: true,
  });

  return ixpParams[CreatorHubNavigationUserParameters.EnableCreationsNavLayout] === true;
};

export default useEnableCreationsNavLayout;
