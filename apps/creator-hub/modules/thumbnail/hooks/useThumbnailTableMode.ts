import { useMemo } from 'react';
import { useLocalStorage } from '@rbx/react-utilities';
import { useAuthentication } from '@modules/authentication/providers';

export enum ThumbnailTableMode {
  View = 'view',
  Edit = 'edit',
}

function useThumbnailTableMode({ universeId }: { universeId: number }) {
  const { user } = useAuthentication();
  const key = useMemo(() => {
    return `ThumbnailTableMode-${universeId}-${user?.id}`;
  }, [universeId, user?.id]);

  const [mode, setMode] = useLocalStorage(key, ThumbnailTableMode.View);

  return useMemo(
    () => ({
      isEditing: mode === ThumbnailTableMode.Edit,
      turnOnEditingMode: () => setMode(ThumbnailTableMode.Edit),
      turnOffEditingMode: () => setMode(ThumbnailTableMode.View),
    }),
    [mode, setMode],
  );
}

export default useThumbnailTableMode;
