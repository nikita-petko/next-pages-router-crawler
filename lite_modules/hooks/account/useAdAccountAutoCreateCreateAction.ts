import { useCallback } from 'react';

import { openAdAccountAutoCreateDialog } from '@components/account/dialogs/AdAccountAutoCreateDialog';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';

const useAdAccountAutoCreateCreateAction = (onNavigate: () => void, entryPoint = 'unknown') => {
  const isAdAccountAutoCreateEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const adAccountId = useAppStore((state: AppStoreType) => state.appData.adAccountId);

  const handleCreateClick = useCallback(() => {
    if (isAdAccountAutoCreateEnabled && !adAccountId) {
      openAdAccountAutoCreateDialog({
        entryPoint,
        onSuccess: onNavigate,
      });
      return;
    }
    onNavigate();
  }, [adAccountId, entryPoint, isAdAccountAutoCreateEnabled, onNavigate]);

  return handleCreateClick;
};

export default useAdAccountAutoCreateCreateAction;
