import { useEffect, useState } from 'react';
import { developClient } from '@modules/clients';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';

const STATUS_PUBLIC = 'Public';

const useUniversePublishStatus = (universeId: number) => {
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isError, setError] = useState<boolean>(false);
  const [isPublished, setPublished] = useState<boolean>(false);

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

        const { privacyType } = response;
        setPublished(privacyType === STATUS_PUBLIC);
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, [universeId]);

  return { isLoading, isError, isPublished };
};

export default useUniversePublishStatus;
