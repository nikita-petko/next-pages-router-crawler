import { useEffect, useState } from 'react';
import developClient from '@modules/clients/develop';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { isPrivateAudience } from '@modules/creations/common/audiences';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';

const STATUS_PUBLIC = 'Public';

const useUniversePublishStatus = (universeId: number) => {
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isError, setError] = useState<boolean>(false);
  const [isPublished, setPublished] = useState<boolean>(false);
  const {
    params: { enableAudiencesReplacement },
  } = useIXPParameters(IXPLayers.CreatorHubCreationsPermission);

  useEffect(() => {
    const loadStatus = async () => {
      if (universeId === uninitializedUniverseId) {
        return;
      }

      setLoading(true);
      setError(false);
      try {
        const response = await developClient.getUniverseConfiguration(universeId);
        if (response == null) {
          setError(true);
          return;
        }

        if (enableAudiencesReplacement === true) {
          setPublished(!isPrivateAudience(response.audiences));
          return;
        }

        const { privacyType } = response;
        setPublished(privacyType === STATUS_PUBLIC);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    void loadStatus();
  }, [universeId, enableAudiencesReplacement]);

  return { isLoading, isError, isPublished };
};

export default useUniversePublishStatus;
