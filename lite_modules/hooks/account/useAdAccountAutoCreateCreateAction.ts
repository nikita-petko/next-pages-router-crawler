import { useCallback } from 'react';

import { openAdAccountAutoCreateDialog } from '@components/account/dialogs/AdAccountAutoCreateDialog';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';

const useAdAccountAutoCreateCreateAction = (
  onNavigate: () => void,
  entryPoint?: string,
  groupId?: number,
  groupName?: string,
) => {
  const resolvedEntryPoint = entryPoint ?? 'unknown';
  const isAdAccountAutoCreateEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const adAccountId = useAppStore((state: AppStoreType) => state.appData.adAccountId);

  const handleCreateClick = useCallback(() => {
    if (isAdAccountAutoCreateEnabled && !adAccountId) {
      const groupAdvertiser =
        groupId !== undefined
          ? useAppStore.getState().groupScopedAccountStateByGroupId[groupId]?.advertiserState.data
          : undefined;
      const groupTimeZone = groupAdvertiser?.ad_account?.id
        ? groupAdvertiser.organization?.time_zone
        : undefined;
      const resolvedGroupName = groupName ?? groupAdvertiser?.ad_account?.name;
      openAdAccountAutoCreateDialog({
        entryPoint: resolvedEntryPoint,
        ...(groupTimeZone !== undefined && resolvedGroupName !== undefined
          ? {
              existingGroupAccount: {
                name: resolvedGroupName,
                timeZone: groupTimeZone,
              },
            }
          : {}),
        onSuccess: onNavigate,
      });
      return;
    }
    onNavigate();
  }, [
    adAccountId,
    groupId,
    groupName,
    isAdAccountAutoCreateEnabled,
    onNavigate,
    resolvedEntryPoint,
  ]);

  return handleCreateClick;
};

export default useAdAccountAutoCreateCreateAction;
