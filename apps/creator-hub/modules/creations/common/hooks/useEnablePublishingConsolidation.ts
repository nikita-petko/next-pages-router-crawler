import { CreatorHubPublishingParameters, IXPLayers } from '@modules/clients/ixpExperiments';
import { useIXPParameters } from '@modules/miscellaneous/hooks';

const useEnablePublishingConsolidation = () => {
  const { params } = useIXPParameters(IXPLayers.CreatorHubPublishing, {
    restoreInitialValueFromCache: true,
  });

  return params[CreatorHubPublishingParameters.EnablePublishingConsolidation] === true;
};

export default useEnablePublishingConsolidation;
