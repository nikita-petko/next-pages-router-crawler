import { useCallback, useState } from 'react';
import gamejoinClient from '@modules/clients/gamejoin';
import gamesClient from '@modules/clients/games';
import { useStudio, EStudioTaskType } from '@modules/miscellaneous/hooks';

const useStudioEditPlaceLauncher = (universeId: number) => {
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isError, setError] = useState<boolean>(false);
  const { open, dialog } = useStudio();

  const launch = useCallback(async () => {
    // Fetch root place ID for universe
    setLoading(true);
    try {
      const response = await gamesClient.getDetails([universeId]);
      if (response.data == null || response.data.length < 1) {
        setError(true);
        return;
      }

      const [{ rootPlaceId }] = response.data;
      if (rootPlaceId == null) {
        setError(true);
        return;
      }

      // Pre-launch the Team Create RCC server so it is ready by the time Studio finishes starting
      gamejoinClient.teamCreatePreemptive(rootPlaceId);

      open({
        task: EStudioTaskType.EditPlace,
        universeId: universeId.toString(),
        placeId: rootPlaceId.toString(),
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [universeId, open]);

  return { isLoading, isError, launch, dialog };
};

export default useStudioEditPlaceLauncher;
