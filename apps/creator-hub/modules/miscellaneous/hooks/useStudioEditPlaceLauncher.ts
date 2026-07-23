import { useCallback } from 'react';
import gamejoinClient from '@modules/clients/gamejoin';
import useStudio, { EStudioTaskType } from './useStudio';

type StudioEditPlaceLauncher = {
  launch: (universeId: number, placeId: number) => void;
  dialog: React.ReactElement;
  isCompatible: boolean;
};

const useStudioEditPlaceLauncher = (): StudioEditPlaceLauncher => {
  const { open, dialog, isCompatible } = useStudio();

  const launch = useCallback(
    (universeId: number, placeId: number) => {
      // Pre-launch the Team Create RCC server so it is ready by the time Studio finishes starting
      gamejoinClient.teamCreatePreemptive(placeId);

      open({
        task: EStudioTaskType.EditPlace,
        universeId: universeId.toString(),
        placeId: placeId.toString(),
      });
    },
    [open],
  );

  return { launch, dialog, isCompatible };
};

export default useStudioEditPlaceLauncher;
