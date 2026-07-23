import { AppDataBase } from '@type/appStore';
import {
  AccountSummaryItem,
  CreatorWorkspace,
  GroupScopedAccountState,
} from '@type/groupScopedAccount';
import { isGroupAdAccountMissing } from '@utils/groupAdAccountSetup';

export const getSelectedGroupId = (
  currentWorkspace?: CreatorWorkspace,
  isAdAccountAutoCreateEnabled: boolean = false,
): number | undefined => {
  if (!isAdAccountAutoCreateEnabled || currentWorkspace?.creatorType !== 'Group') {
    return undefined;
  }

  return currentWorkspace.creatorId;
};

export const selectAccountSummaryItems = ({
  appData,
  currentWorkspace,
  groupScopedAccountState,
  isAdAccountAutoCreateEnabled = false,
}: {
  appData: AppDataBase;
  currentWorkspace?: CreatorWorkspace;
  groupScopedAccountState?: GroupScopedAccountState;
  isAdAccountAutoCreateEnabled?: boolean;
}): AccountSummaryItem[] => {
  const items: AccountSummaryItem[] = [];
  if (appData.adAccountInfo) {
    items.push({
      adAccountId: appData.adAccountInfo.id,
      ownerName:
        appData.currentUser?.name ?? appData.currentUser?.displayName ?? appData.adAccountInfo.name,
      timeZone: appData.organizationInfo?.time_zone,
    });
  }

  const groupId = getSelectedGroupId(currentWorkspace, isAdAccountAutoCreateEnabled);
  if (groupId) {
    const groupAdvertiserState = groupScopedAccountState?.advertiserState;
    const groupAdvertiser = groupAdvertiserState?.data;
    const isGroupLoading =
      !groupAdvertiser &&
      !groupAdvertiserState?.isError &&
      (groupAdvertiserState?.isLoading ?? true);
    items.push({
      adAccountId: groupAdvertiser?.ad_account?.id,
      isLoading: isGroupLoading,
      needsSetup: isGroupAdAccountMissing(groupAdvertiserState),
      ownerName: currentWorkspace?.creatorName ?? groupAdvertiser?.ad_account?.name,
      timeZone: groupAdvertiser?.organization?.time_zone,
    });
  }

  return items;
};
