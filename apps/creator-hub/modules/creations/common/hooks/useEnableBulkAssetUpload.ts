import { CreatorHubPublishingParameters, IXPLayers } from '@modules/clients/ixpExperiments';
import { useIXPParameters } from '@modules/miscellaneous/hooks';

const useEnableBulkAssetUpload = () => {
  const { params } = useIXPParameters(IXPLayers.CreatorHubPublishing, {
    restoreInitialValueFromCache: true,
  });

  return params[CreatorHubPublishingParameters.EnableBulkAssetUpload] === true;
};

export default useEnableBulkAssetUpload;
