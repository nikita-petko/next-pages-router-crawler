import { useWorkspaces } from '@rbx/creator-hub-navigation';
import { useCallback, useEffect, useRef } from 'react';

import { openAdAccountAutoCreateDialog } from '@components/account/dialogs/AdAccountAutoCreateDialog';
import { useDialogStore } from '@components/common/dialog/store';
import { useAppStore } from '@stores/appStoreProvider';
import { useNewFlowStore } from '@stores/newFlowStoreProvider';
import { CaptureException } from '@utils/error';

const useGroupWorkspacePersonalAccountSetup = (enabled: boolean = true): void => {
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspaces();
  const isAdAccountAutoCreateEnabled = useAppStore(
    (state) => state.appMetadataState.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const personalAdAccountId = useAppStore((state) => state.appData.adAccountId);
  const userOver13 = useAppStore((state) => state.appData.userOver13);
  const groupId =
    currentWorkspace?.creatorType === 'Group' ? currentWorkspace.creatorId : undefined;
  const groupAdvertiserState = useAppStore((state) =>
    groupId ? state.groupScopedAccountStateByGroupId[groupId]?.advertiserState : undefined,
  );
  const fetchInitialData = useNewFlowStore((state) => state.fetchInitialData);
  const selectedUniverseId = useNewFlowStore(
    (state) => state.universePickerFilterState.universeFilter.universe_id,
  );
  const isDialogOpen = useDialogStore((state) => state.isOpen);
  const previousGroupIdRef = useRef<number | undefined>(undefined);
  const promptedGroupIdsRef = useRef<Set<number>>(new Set());

  const refreshCampaignTable = useCallback((): void => {
    if (groupId === undefined) {
      return;
    }

    fetchInitialData(false, undefined, {
      initialUniverseId: selectedUniverseId || undefined,
      workspace: {
        creatorId: groupId,
        creatorType: 'Group',
      },
    }).catch((error) => {
      CaptureException(error, { context: 'refreshCampaignTableAfterAdAccountCreation' });
    });
  }, [fetchInitialData, groupId, selectedUniverseId]);

  useEffect(() => {
    const previousGroupId = previousGroupIdRef.current;
    if (previousGroupId !== groupId) {
      if (previousGroupId !== undefined) {
        promptedGroupIdsRef.current.delete(previousGroupId);
      }
      previousGroupIdRef.current = groupId;
    }

    const groupAdvertiser = groupAdvertiserState?.data;
    const groupTimeZone = groupAdvertiser?.organization?.time_zone;

    if (
      !enabled ||
      !isAdAccountAutoCreateEnabled ||
      personalAdAccountId ||
      userOver13 !== true ||
      isWorkspaceLoading ||
      groupId === undefined ||
      groupAdvertiserState?.isError ||
      !groupAdvertiser?.ad_account?.id ||
      groupTimeZone === undefined ||
      isDialogOpen ||
      useDialogStore.getState().isOpen ||
      promptedGroupIdsRef.current.has(groupId)
    ) {
      return;
    }

    promptedGroupIdsRef.current.add(groupId);
    openAdAccountAutoCreateDialog({
      entryPoint: 'groupWorkspacePageLoad',
      existingGroupAccount: {
        name: currentWorkspace?.creatorName ?? groupAdvertiser.ad_account.name,
        timeZone: groupTimeZone,
      },
      onSuccess: refreshCampaignTable,
    });
  }, [
    groupAdvertiserState,
    groupId,
    currentWorkspace?.creatorName,
    enabled,
    isAdAccountAutoCreateEnabled,
    isDialogOpen,
    isWorkspaceLoading,
    personalAdAccountId,
    refreshCampaignTable,
    userOver13,
  ]);
};

export default useGroupWorkspacePersonalAccountSetup;
