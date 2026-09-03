import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { isGroupAdAccountMissing } from '@utils/groupAdAccountSetup';

interface AdCreativeGroupScope {
  /**
   * Group id to send on ad-creative requests, or `undefined` to keep them on
   * the personal ad-account scope.
   */
  groupId?: number;
  /**
   * True until the group advertiser resolves to either an existing account or
   * a confirmed missing-account state. Callers must hold off while this is
   * true so loading and unexpected errors cannot silently fall back to the
   * personal account.
   */
  isResolving: boolean;
}

/**
 * Narrows a group workspace id down to the scope ad-creative requests can
 * actually use. AMA rejects `?groupId=` with AD_ACCOUNT_NOT_FOUND /
 * ORGANIZATION_NOT_FOUND when the group has no ad account, so a group
 * workspace with the auto-create flag on is not sufficient — the group ad
 * account has to exist. Until it does, the group scope is dropped and requests
 * fall back to the caller's personal ad account.
 *
 * `AdsManagerPageBaseLayout` fetches the selected group's advertiser on every
 * page, so an absent store slice means that fetch hasn't landed yet rather
 * than that the group has no ad account.
 */
const useAdCreativeGroupScope = (workspaceGroupId?: number): AdCreativeGroupScope => {
  const advertiserState = useAppStore((state: AppStoreType) =>
    workspaceGroupId === undefined
      ? undefined
      : state.groupScopedAccountStateByGroupId[workspaceGroupId]?.advertiserState,
  );

  if (workspaceGroupId === undefined) {
    return { groupId: undefined, isResolving: false };
  }

  if (
    advertiserState === undefined ||
    advertiserState.isLoading ||
    (!advertiserState.data?.ad_account?.id && !isGroupAdAccountMissing(advertiserState))
  ) {
    return { groupId: undefined, isResolving: true };
  }

  return {
    groupId: advertiserState.data?.ad_account?.id ? workspaceGroupId : undefined,
    isResolving: false,
  };
};

export default useAdCreativeGroupScope;
