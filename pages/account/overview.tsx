import { useWorkspaces } from '@rbx/creator-hub-navigation';
import { useRouter } from 'next/router';
import { ReactNode, useCallback, useEffect, useState } from 'react';

import AccountSummary from '@components/account/AccountSummary';
import { openGroupAdAccountSetupDialog } from '@components/billing/dialogs/GroupAdAccountSetupDialog';
import UnifiedPaymentStatusToast from '@components/billing/UnifiedPaymentStatusToast';
import AdsManagerPageBaseLayout from '@components/common/AdsManagerDefaultLayout';
import { getCreatorHubPageLayout } from '@components/common/CreatorHubPageLayout';
import GenericSnackBar from '@components/common/GenericSnackBar';
import { CardVerificationResultEnum } from '@constants/billing';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { CaptureException } from '@utils/error';
import { getSelectedGroupId, selectAccountSummaryItems } from '@utils/groupScopedAccount';

const getAccountOverviewPageLayout = (page: ReactNode) =>
  getCreatorHubPageLayout(page, {
    headerKey: 'Heading.AccountOverview',
    headerNamespace: TranslationNamespace.Account,
  });

const AccountOverview = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Misc);
  const router = useRouter();
  const { isFromSuccessfulAccountEdit } = router.query;

  const appData = useAppStore((state: AppStoreType) => state.appData);
  const { adCreditActivated, paymentProfiles } = appData;
  const adAccountStatusState = useAppStore((state: AppStoreType) => state.adAccountStatusState);
  const getPaymentProfilesState = useAppStore(
    (state: AppStoreType) => state.getPaymentProfilesState,
  );
  const isAdAccountAutoCreateEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspaces();
  const isWorkspaceGateLoading = isAdAccountAutoCreateEnabled && isWorkspaceLoading;
  const groupId = getSelectedGroupId(currentWorkspace, isAdAccountAutoCreateEnabled);
  const groupScopedAccountState = useAppStore((state: AppStoreType) =>
    groupId ? state.groupScopedAccountStateByGroupId[groupId] : undefined,
  );
  const activeAdAccountStatusState = groupId
    ? groupScopedAccountState?.adAccountStatusState
    : adAccountStatusState;

  const advertisingEnabled = useAppStore((state: AppStoreType) =>
    state.advertisingShouldBeEnabled(),
  );

  const [pageFetchingEssentialData, setPageFetchingEssentialData] = useState<boolean>(true);
  const fetchEssentialAppInfo = useAppStore((state: AppStoreType) => state.fetchEssentialAppInfo);
  const getPaymentProfiles = useAppStore((state: AppStoreType) => state.getPaymentProfiles);
  const getAdAccountStatus = useAppStore((state: AppStoreType) => state.getAdAccountStatus);

  const paymentProfile = paymentProfiles[0] ?? null;
  const hasUnverifiedCard = paymentProfile ? !paymentProfile.is_verified : false;
  const hasFailedPayment = activeAdAccountStatusState?.data?.hasFailedPayment ?? false;
  const loadingPaymentProfile = getPaymentProfilesState.isLoading;
  const loadingPaymentStatus =
    activeAdAccountStatusState?.isLoading ?? Boolean(groupId && !activeAdAccountStatusState);

  let showFailedCardAuthBanner = false;
  let showUnknownErrorBanner = false;
  let showSomethingWentWrongBanner = false;
  if (router.query.state === CardVerificationResultEnum.CARD_AUTHENTICATION_FAILED) {
    showFailedCardAuthBanner = true;
  } else if (router.query.state === CardVerificationResultEnum.UNKNOWN_STRIPE_ERROR) {
    showUnknownErrorBanner = true;
  } else if (router.query.state === CardVerificationResultEnum.SOMETHING_WENT_WRONG) {
    showSomethingWentWrongBanner = true;
  }

  useEffect(() => {
    if (isWorkspaceGateLoading) {
      return;
    }

    const fetchAccountData = async () => {
      await fetchEssentialAppInfo({ forceRefresh: true, urlPath: Routes.ACCOUNT_OVERVIEW });
      setPageFetchingEssentialData(false);
    };

    fetchAccountData();
  }, [fetchEssentialAppInfo, isWorkspaceGateLoading]);

  useEffect(() => {
    if (
      !isWorkspaceGateLoading &&
      appData.organizationInfo &&
      appData.adAccountInfo &&
      paymentProfiles
    ) {
      setPageFetchingEssentialData(false);
    }
  }, [appData.organizationInfo, appData.adAccountInfo, paymentProfiles, isWorkspaceGateLoading]);

  let headerSection: ReactNode;

  const accountIsInternal = useAppStore((state: AppStoreType) =>
    state.adAccountIsInternalManaged(),
  );
  const accountIsManaged = useAppStore((state: AppStoreType) => state.adAccountIsExternalManaged());

  if (
    accountIsManaged ||
    accountIsInternal ||
    loadingPaymentProfile ||
    loadingPaymentStatus ||
    pageFetchingEssentialData ||
    (adCreditActivated && advertisingEnabled.advertisingShouldBeEnabled)
  ) {
    headerSection = null;
  } else {
    headerSection = (
      <UnifiedPaymentStatusToast
        failedCardAuthorization={showFailedCardAuthBanner}
        hasActiveChallenge={paymentProfile?.has_active_challenge}
        hasFailedPayment={hasFailedPayment}
        hasNoPaymentMethod={(paymentProfile === null || hasUnverifiedCard) && !adCreditActivated}
        hasUnknownError={showUnknownErrorBanner}
        hasUnverifiedCard={hasUnverifiedCard}
        paymentProfileId={paymentProfile?.payment_profile_id}
        refreshFunc={async () => {
          try {
            const [paymentStatusResult, paymentProfileResult] = await Promise.all([
              getAdAccountStatus(groupId),
              getPaymentProfiles(true),
            ]);
            const checkPaymentDeclined = paymentStatusResult.hasFailedPayment;
            const refreshedPaymentProfile = paymentProfileResult?.data[0] ?? null;
            const checkUnverifiedCardStatus = refreshedPaymentProfile
              ? !refreshedPaymentProfile.is_verified
              : false;

            return checkPaymentDeclined || checkUnverifiedCardStatus;
          } catch (error) {
            CaptureException(error as Error);
            return false;
          }
        }}
        somethingWentWrong={showSomethingWentWrongBanner}
      />
    );
  }

  const accountSummaryItems = selectAccountSummaryItems({
    appData,
    currentWorkspace,
    groupScopedAccountState,
    isAdAccountAutoCreateEnabled,
  });
  const handleSetUpGroupAccount = useCallback(() => {
    if (!groupId) {
      return;
    }

    openGroupAdAccountSetupDialog({
      entryPoint: 'accountOverview',
      groupId,
      groupName: currentWorkspace?.creatorName || translate('Label.RobloxAdCredit'),
      onComplete: async () => {
        await fetchEssentialAppInfo({
          forceRefresh: true,
          groupId,
          urlPath: Routes.ACCOUNT_OVERVIEW,
        });
      },
    });
  }, [currentWorkspace?.creatorName, fetchEssentialAppInfo, groupId, translate]);

  return (
    <AdsManagerPageBaseLayout
      groupId={groupId}
      headerSection={headerSection}
      isLoading={pageFetchingEssentialData}>
      <div>
        {isFromSuccessfulAccountEdit && (
          <GenericSnackBar message={translate('Message.ChangesSaved')} severity='success' />
        )}
        <AccountSummary accounts={accountSummaryItems} onSetUpAccount={handleSetUpGroupAccount} />
      </div>
    </AdsManagerPageBaseLayout>
  );
};

AccountOverview.getPageLayout = getAccountOverviewPageLayout;

export default AccountOverview;
