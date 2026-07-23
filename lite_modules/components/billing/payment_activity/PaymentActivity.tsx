import { useWorkspaces } from '@rbx/creator-hub-navigation';
import { Button } from '@rbx/foundation-ui';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import BillingAccountViewSwitcher from '@components/billing/common/BillingAccountViewSwitcher';
import PaymentActivityTabsNavigation from '@components/billing/payment_activity/PaymentActivityTabNavigation';
import UnifiedPaymentStatusToast from '@components/billing/UnifiedPaymentStatusToast';
import CustomCircularProgress from '@components/common/CustomCircularProgress';
import { openErrorDialog } from '@components/common/dialog/errorDialog';
import {
  DEFAULT_PAYMENT_THRESHOLD_MICRO_USD,
  MICRO_USD_IN_USD,
  parsePaymentActivityTab,
  PaymentActivityTabType,
} from '@constants/billing';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import { useBillingAccountView } from '@hooks/useBillingAccountView';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { adAccountCurrentBalance } from '@services/ads/adAccountFinanceService';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { PaymentProfileType } from '@type/payment';
import { CaptureException } from '@utils/error';
import { getSelectedGroupId } from '@utils/groupScopedAccount';
import { navigateToGroupReloadAdCredit } from '@utils/navigateToGroupReloadAdCredit';

const PaymentActivity = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  const router = useRouter();
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspaces();
  const isAdAccountAutoCreateEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const groupId = getSelectedGroupId(currentWorkspace, isAdAccountAutoCreateEnabled);
  const showAccountViewSwitcher = Boolean(groupId);

  const changeTabCb = useCallback(
    (tabNum: PaymentActivityTabType) => {
      router.push({
        pathname: router.pathname,
        query: {
          ...router.query,
          tab: tabNum,
        },
      });
    },
    [router],
  );

  // TODO: [4/19/23] Check router query for failure states

  const { adAccountInfo, adCreditActivated, adCreditBalance, currentUser } = useAppStore(
    (state: AppStoreType) => state.appData,
  );
  const getAdAccountStatus = useAppStore((state: AppStoreType) => state.getAdAccountStatus);
  const getAdCredit = useAppStore((state: AppStoreType) => state.getAdCredit);
  const getAdvertiser = useAppStore((state: AppStoreType) => state.getAdvertiser);
  const groupAdCreditState = useAppStore((state: AppStoreType) =>
    groupId ? state.groupScopedAccountStateByGroupId[groupId]?.adCreditState : undefined,
  );
  const groupAdvertiserState = useAppStore((state: AppStoreType) =>
    groupId ? state.groupScopedAccountStateByGroupId[groupId]?.advertiserState : undefined,
  );
  const groupAdCreditBalance = groupAdCreditState?.data?.ad_credit_balance_in_micro ?? 0;
  const isGroupAdCreditLoading =
    Boolean(groupId) && (!groupAdCreditState || groupAdCreditState.isLoading);
  const isGroupAdCreditError = Boolean(groupId) && Boolean(groupAdCreditState?.isError);

  // Get user's default payment profile and check if card is unverified.
  const [loadingPaymentProfile, setIsLoadingPaymentProfile] = useState<boolean>(true);
  const [paymentProfile, setPaymentProfile] = useState<PaymentProfileType | null>(null);
  const [hasUnverifiedCard, setHasUnverifiedCard] = useState<boolean>(true);
  const [cardBalance, setCardBalance] = useState<number | null>(null);
  const getPaymentProfiles = useAppStore((state: AppStoreType) => state.getPaymentProfiles);
  const resolvePaymentProfile = useCallback(
    async (shouldTriggerBanner: boolean) => {
      try {
        const listPaymentProfilesResponse = await getPaymentProfiles(true);
        if (!listPaymentProfilesResponse || listPaymentProfilesResponse.data.length === 0) {
          setIsLoadingPaymentProfile(false);
          return false;
        }

        const profile = listPaymentProfilesResponse.data[0];
        setPaymentProfile(profile);
        if (shouldTriggerBanner) {
          setHasUnverifiedCard(!profile.is_verified);
        }
        setIsLoadingPaymentProfile(false);
        return !profile.is_verified;
      } catch (error) {
        CaptureException(error as Error);
        openErrorDialog();
        setIsLoadingPaymentProfile(false);
        return false;
      }
    },
    [getPaymentProfiles],
  );

  // Check if user has a failed payment
  const [isLoadingPaymentStatus, setIsLoadingPaymentStatus] = useState<boolean>(true);
  const [hasFailedPayment, setHasFailedPayment] = useState<boolean>(true);
  const resolvePaymentStatus = useCallback(
    async (shouldTriggerBanner: boolean) => {
      try {
        const { hasFailedPayment: failedPayment } = await getAdAccountStatus();
        if (shouldTriggerBanner) {
          setHasFailedPayment(failedPayment);
        }
        setIsLoadingPaymentStatus(false);
        return failedPayment;
      } catch (error) {
        CaptureException(error as Error);
        openErrorDialog();
        setIsLoadingPaymentStatus(false);
        return false;
      }
    },
    [getAdAccountStatus],
  );

  const resolveCardBalance = useCallback(async () => {
    try {
      const currentBalance = await adAccountCurrentBalance();
      setCardBalance(currentBalance);
    } catch (error) {
      CaptureException(error as Error);
      openErrorDialog();
    }
  }, []);

  useEffect(() => {
    resolvePaymentProfile(true);
    resolvePaymentStatus(true);
  }, [resolvePaymentProfile, resolvePaymentStatus]);

  useEffect(() => {
    if (isWorkspaceLoading || !groupId) {
      return;
    }

    getAdCredit(groupId).catch((error) => {
      CaptureException(error as Error);
    });
  }, [getAdCredit, groupId, isWorkspaceLoading]);

  useEffect(() => {
    if (isWorkspaceLoading || !groupId) {
      return;
    }

    getAdvertiser(false, groupId).catch((error) => {
      CaptureException(error as Error);
    });
  }, [getAdvertiser, groupId, isWorkspaceLoading]);

  const requestedTab = parsePaymentActivityTab(router.query.tab);
  const isLegacyGroupTab =
    requestedTab === PaymentActivityTabType.GROUP_AD_CREDIT_PAYMENT_ACTIVITY_TAB;

  const { accountView, changeAccountView, isGroupAccountView } = useBillingAccountView({
    preferGroupFromLegacyTab: isLegacyGroupTab,
    router,
    shouldSyncUrl: !isWorkspaceLoading && !loadingPaymentProfile && !isLoadingPaymentStatus,
    showAccountViewSwitcher,
  });

  const isGroupAccountViewWithId = isGroupAccountView && groupId !== undefined;
  const showCardTab = !hasUnverifiedCard && !isGroupAccountViewWithId;
  const showAdCreditTab = adCreditActivated || isGroupAccountViewWithId;

  useEffect(() => {
    if (!showCardTab || cardBalance !== null) {
      return;
    }

    resolveCardBalance();
  }, [cardBalance, resolveCardBalance, showCardTab]);

  const visibleTabValues = useMemo(
    () =>
      [
        showCardTab ? PaymentActivityTabType.CARD_PAYMENT_ACTIVITY_TAB : null,
        showAdCreditTab ? PaymentActivityTabType.AD_CREDIT_PAYMENT_ACTIVITY_TAB : null,
      ].filter((tabValue): tabValue is PaymentActivityTabType => tabValue !== null),
    [showAdCreditTab, showCardTab],
  );

  const selectedTab = useMemo(() => {
    if (isLegacyGroupTab && isGroupAccountViewWithId && showAdCreditTab) {
      return PaymentActivityTabType.AD_CREDIT_PAYMENT_ACTIVITY_TAB;
    }
    if (requestedTab !== undefined && visibleTabValues.includes(requestedTab)) {
      return requestedTab;
    }
    return visibleTabValues[0] ?? PaymentActivityTabType.CARD_PAYMENT_ACTIVITY_TAB;
  }, [isGroupAccountViewWithId, isLegacyGroupTab, requestedTab, showAdCreditTab, visibleTabValues]);

  useEffect(() => {
    if (
      !router.isReady ||
      loadingPaymentProfile ||
      isLoadingPaymentStatus ||
      isWorkspaceLoading ||
      visibleTabValues.length === 0
    ) {
      return;
    }

    const currentTab = Array.isArray(router.query.tab) ? router.query.tab[0] : router.query.tab;
    const needsTabUpdate = currentTab !== String(selectedTab) || isLegacyGroupTab;

    if (!needsTabUpdate) {
      return;
    }

    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        tab: selectedTab,
      },
    });
  }, [
    isLegacyGroupTab,
    isLoadingPaymentStatus,
    isWorkspaceLoading,
    loadingPaymentProfile,
    router,
    selectedTab,
    visibleTabValues.length,
  ]);

  const paymentThreshold = adAccountInfo?.billing_threshold_micro_usd
    ? adAccountInfo.billing_threshold_micro_usd / MICRO_USD_IN_USD
    : DEFAULT_PAYMENT_THRESHOLD_MICRO_USD / MICRO_USD_IN_USD;

  const handleGroupReloadBalanceClick = () => {
    if (!groupId) {
      return;
    }

    navigateToGroupReloadAdCredit({
      entryPoint: 'paymentActivityReloadGroupAdCredit',
      groupAdvertiserState,
      groupId,
      groupName: currentWorkspace?.creatorName || translate('Label.RobloxAdCredit'),
      router,
    });
  };

  // Display banners based on account status
  const unifiedPaymentStatusToast = (
    <UnifiedPaymentStatusToast
      failedCardAuthorization={false}
      hasActiveChallenge={paymentProfile?.has_active_challenge}
      hasFailedPayment={hasFailedPayment}
      hasNoPaymentMethod={(paymentProfile === null || hasUnverifiedCard) && !adCreditActivated}
      hasUnknownError={false}
      hasUnverifiedCard={hasUnverifiedCard}
      paymentProfileId={paymentProfile?.payment_profile_id}
      // Retrieves the latest backend data and hides banners as necessary after the user closes the card verification modal:
      refreshFunc={async () => {
        const checkPaymentDeclined = await resolvePaymentStatus(false);
        const checkUnverifiedCardStatus = await resolvePaymentProfile(false);

        setHasFailedPayment(checkPaymentDeclined);
        setHasUnverifiedCard(checkUnverifiedCardStatus);
        return checkPaymentDeclined || checkUnverifiedCardStatus;
      }}
      somethingWentWrong={false}
    />
  );

  const redirectToAddPaymentMethodPage = () => {
    router.push(Routes.ADD_PAYMENT);
  };

  if (loadingPaymentProfile || isLoadingPaymentStatus) {
    return <CustomCircularProgress />;
  }

  return (
    <>
      {unifiedPaymentStatusToast}
      {!(paymentProfile && adCreditBalance) && (
        <div>
          <Button
            data-testid='addPaymentMethodButton'
            onClick={redirectToAddPaymentMethodPage}
            size='Medium'
            variant='Standard'>
            {translate('Heading.AddPaymentMethod')}
          </Button>
        </div>
      )}
      {showAccountViewSwitcher ? (
        <BillingAccountViewSwitcher
          groupName={currentWorkspace?.creatorName || translate('Label.RobloxAdCredit')}
          onAccountViewChange={changeAccountView}
          personalAccountName={
            currentUser?.name || currentUser?.displayName || translate('Heading.PersonalFunds')
          }
          value={accountView}
        />
      ) : null}
      <PaymentActivityTabsNavigation
        accountView={accountView}
        adCreditBalance={adCreditBalance}
        cardBalance={cardBalance}
        changeTabCb={changeTabCb}
        groupAdCreditBalance={groupAdCreditBalance}
        groupId={groupId}
        hasFailedPayment={hasFailedPayment}
        isAdCreditActivated={adCreditActivated}
        isCardActivated={!hasUnverifiedCard}
        isGroupAdCreditError={isGroupAdCreditError}
        isGroupAdCreditLoading={isGroupAdCreditLoading}
        onGroupReloadBalanceClick={handleGroupReloadBalanceClick}
        paymentProfile={paymentProfile}
        paymentThreshold={paymentThreshold}
        selectedTab={selectedTab}
      />
    </>
  );
};

export default PaymentActivity;
