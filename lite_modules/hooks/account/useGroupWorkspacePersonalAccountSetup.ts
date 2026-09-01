import { useWorkspaces } from '@rbx/creator-hub-navigation';
import { useCallback, useEffect, useRef } from 'react';

import AdAccountAutoCreateDialog, {
  openAdAccountAutoCreateDialog,
} from '@components/account/dialogs/AdAccountAutoCreateDialog';
import { useDialogStore } from '@components/common/dialog/store';
import useAdAccountAutoCreateModalGate from '@hooks/account/useAdAccountAutoCreateModalGate';
import { useAppStore } from '@stores/appStoreProvider';
import { useNewFlowStore } from '@stores/newFlowStoreProvider';
import { CaptureException } from '@utils/error';

const useGroupWorkspacePersonalAccountSetup = (
  enabled: boolean = true,
  isEnablingConditionResolved: boolean = true,
): void => {
  const { currentWorkspace, isLoading: isWorkspaceLoading, workspaces } = useWorkspaces();
  const isAdAccountAutoCreateEnabled = useAppStore(
    (state) => state.appMetadataState.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const isMetadataError = useAppStore((state) => state.appMetadataState.isError);
  const isMetadataLoading = useAppStore((state) => state.appMetadataState.isLoading);
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
  const activeDialogComponent = useDialogStore((state) => state.render?.Component);
  const isDialogOpen = useDialogStore((state) => state.isOpen);
  const gateStatus = useAdAccountAutoCreateModalGate((state) => state.status);
  const setGateStatus = useAdAccountAutoCreateModalGate((state) => state.setStatus);
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

    if (gateStatus === 'showing') {
      if (isDialogOpen || activeDialogComponent === AdAccountAutoCreateDialog) {
        return;
      }
      setGateStatus('dismissed');
      return;
    }

    if (!enabled || isMetadataError || !isAdAccountAutoCreateEnabled || personalAdAccountId) {
      setGateStatus('willNotShow');
      return;
    }

    if (
      !isEnablingConditionResolved ||
      isMetadataLoading ||
      userOver13 === null ||
      isWorkspaceLoading ||
      currentWorkspace == null ||
      workspaces == null
    ) {
      setGateStatus('pending');
      return;
    }

    if (
      userOver13 === false ||
      currentWorkspace.creatorType !== 'Group' ||
      groupAdvertiserState?.isError
    ) {
      setGateStatus('willNotShow');
      return;
    }

    if (!groupAdvertiserState?.data && !groupAdvertiserState?.isError) {
      setGateStatus('pending');
      return;
    }

    if (groupId === undefined || !groupAdvertiser?.ad_account?.id || groupTimeZone === undefined) {
      setGateStatus('willNotShow');
      return;
    }

    if (promptedGroupIdsRef.current.has(groupId)) {
      setGateStatus('dismissed');
      return;
    }

    if (isDialogOpen || useDialogStore.getState().isOpen) {
      setGateStatus('pending');
      return;
    }

    promptedGroupIdsRef.current.add(groupId);
    setGateStatus('showing');
    openAdAccountAutoCreateDialog({
      entryPoint: 'groupWorkspacePageLoad',
      existingGroupAccount: {
        name: currentWorkspace.creatorName ?? groupAdvertiser.ad_account.name,
        timeZone: groupTimeZone,
      },
      onSuccess: refreshCampaignTable,
    });
  }, [
    activeDialogComponent,
    groupAdvertiserState,
    groupId,
    currentWorkspace,
    enabled,
    gateStatus,
    isAdAccountAutoCreateEnabled,
    isDialogOpen,
    isEnablingConditionResolved,
    isMetadataError,
    isMetadataLoading,
    isWorkspaceLoading,
    personalAdAccountId,
    refreshCampaignTable,
    setGateStatus,
    userOver13,
    workspaces,
  ]);
};

export default useGroupWorkspacePersonalAccountSetup;
