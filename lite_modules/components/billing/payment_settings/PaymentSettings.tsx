import { useWorkspaces } from '@rbx/creator-hub-navigation';
import { Button } from '@rbx/foundation-ui';
import { useRouter } from 'next/router';
import { ReactNode, useCallback, useEffect, useState } from 'react';

import CardOutstandingBalance from '@components/billing/balance/CardOutstandingBalance';
import { BuyAdCreditEnum } from '@components/billing/BuyAdCredit';
import BillingAccountViewSwitcher from '@components/billing/common/BillingAccountViewSwitcher';
import BillingPaymentMethodSection, {
  RobloxAdCreditChip,
} from '@components/billing/common/BillingPaymentMethodSection';
import { openFirstPaymentMethodCTADialog } from '@components/billing/dialogs/FirstPaymentMethodCTADialog';
import AdCreditBalance from '@components/billing/payment_settings/AdCreditBalance';
import CreditCardSummary from '@components/billing/payment_settings/CreditCardSummary';
import NoPaymentMethods from '@components/billing/payment_settings/NoPaymentMethods';
import PaymentSettingsStackedToasts from '@components/billing/payment_settings/PaymentSettingsStackedToasts';
import UnifiedPaymentStatusToast from '@components/billing/UnifiedPaymentStatusToast';
import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import { openErrorDialog } from '@components/common/dialog/errorDialog';
import GenericSnackBar from '@components/common/GenericSnackBar';
import {
  AdCreditBalanceScope,
  CardVerificationResultEnum,
  DEFAULT_PAYMENT_THRESHOLD_MICRO_USD,
  MICRO_USD_IN_USD,
} from '@constants/billing';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import { useBillingAccountView } from '@hooks/useBillingAccountView';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { adAccountCurrentBalance } from '@services/ads/adAccountFinanceService';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { usePaymentSettingsStore } from '@stores/paymentSettingsStoreProvider';
import { PaymentProfileType } from '@type/payment';
import { CaptureException } from '@utils/error';
import { getSelectedGroupId } from '@utils/groupScopedAccount';
import { navigateToGroupReloadAdCredit } from '@utils/navigateToGroupReloadAdCredit';

const PaymentSettings = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);

  // TODO: [5/1/23] Clear the state if the user refreshes the page to prevent the success banner from showing again for no reason
  // Check URL for success state from previous page and display success banner if needed
  const router = useRouter();
  const saveCardSuccessMessage = translate('Heading.SaveCardSuccess');
  const buyAdCredSuccessMessage = translate('Heading.BuyAdCreditSuccess');
  const cardRemovedMessage = translate('Heading.CardRemoved');
  let snackBar = null;
  let showFailedCardAuthBanner = false;
  let showUnknownErrorBanner = false;
  let showSomethingWentWrongBanner = false;

  if (router.query.state === BuyAdCreditEnum.SUCCESS) {
    snackBar = <GenericSnackBar message={buyAdCredSuccessMessage} severity='success' />;
  } else if (router.query.state === CardVerificationResultEnum.SUCCESS) {
    snackBar = <GenericSnackBar message={saveCardSuccessMessage} severity='success' />;
  } else if (router.query.state === CardVerificationResultEnum.CARD_AUTHENTICATION_FAILED) {
    showFailedCardAuthBanner = true;
  } else if (router.query.state === CardVerificationResultEnum.UNKNOWN_STRIPE_ERROR) {
    showUnknownErrorBanner = true;
  } else if (router.query.state === CardVerificationResultEnum.SOMETHING_WENT_WRONG) {
    showSomethingWentWrongBanner = true;
  } else if (router.query.state === CardVerificationResultEnum.CARD_REMOVED) {
    snackBar = <GenericSnackBar message={cardRemovedMessage} severity='error' />;
  }

  const { adAccountInfo, adCreditActivated, adCreditBalance, currentUser, userOver18 } =
    useAppStore((state: AppStoreType) => state.appData);
  const getPaymentProfiles = useAppStore((state: AppStoreType) => state.getPaymentProfiles);
  const getAdAccountStatus = useAppStore((state: AppStoreType) => state.getAdAccountStatus);
  const getAdCredit = useAppStore((state: AppStoreType) => state.getAdCredit);
  const getAdvertiser = useAppStore((state: AppStoreType) => state.getAdvertiser);
  const isAdAccountAutoCreateEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspaces();
  const groupId = getSelectedGroupId(currentWorkspace, isAdAccountAutoCreateEnabled);
  const showAccountViewSwitcher = Boolean(groupId);
  const groupAdCreditState = useAppStore((state: AppStoreType) =>
    groupId ? state.groupScopedAccountStateByGroupId[groupId]?.adCreditState : undefined,
  );
  const groupAdvertiserState = useAppStore((state: AppStoreType) =>
    groupId ? state.groupScopedAccountStateByGroupId[groupId]?.advertiserState : undefined,
  );
  const groupAdCreditData = groupAdCreditState?.data;
  const groupAdCreditBalance = groupAdCreditData?.ad_credit_balance_in_micro ?? 0;
  const isGroupAdCreditLoading =
    Boolean(groupId) && (!groupAdCreditState || groupAdCreditState.isLoading);
  const isGroupAdCreditError = Boolean(groupId) && Boolean(groupAdCreditState?.isError);
  const { getAutoReloadData } = usePaymentSettingsStore();

  const advertisingEnabled = useAppStore((state: AppStoreType) =>
    state.advertisingShouldBeEnabled(),
  );

  let paymentThreshold = DEFAULT_PAYMENT_THRESHOLD_MICRO_USD / MICRO_USD_IN_USD;
  if (adAccountInfo?.billing_threshold_micro_usd) {
    paymentThreshold = adAccountInfo.billing_threshold_micro_usd / MICRO_USD_IN_USD;
  }

  const { accountView, changeAccountView, isGroupAccountView } = useBillingAccountView({
    router,
    shouldSyncUrl: !isWorkspaceLoading,
    showAccountViewSwitcher,
  });

  const isGroupAccountViewWithId = isGroupAccountView && groupId !== undefined;

  // Get user's account balance
  const [loadingError, setLoadingError] = useState<boolean>(false);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(true);
  const [balance, setBalance] = useState<number>(0);
  const resolveBalance = useCallback(async () => {
    try {
      const currentBalance = await adAccountCurrentBalance();
      setBalance(currentBalance);
      setLoadingBalance(false);
    } catch (error) {
      setLoadingError(true);
      CaptureException(error as Error);
    }
  }, []);

  // Get user's default payment profile and check if card is unverified.
  const [loadingPaymentProfile, setLoadingPaymentProfile] = useState<boolean>(true);
  const [paymentProfile, setPaymentProfile] = useState<null | PaymentProfileType>(
    null as PaymentProfileType | null,
  );
  const [hasUnverifiedCard, setHasUnverifiedCard] = useState<boolean>(false);
  const resolvePaymentProfile = useCallback(
    async (triggerBanner: boolean) => {
      try {
        const listPaymentProfilesResponse = await getPaymentProfiles(true);
        if (!listPaymentProfilesResponse || listPaymentProfilesResponse.data.length === 0) {
          setLoadingPaymentProfile(false);
          return false;
        }

        const profile = listPaymentProfilesResponse.data[0];
        setPaymentProfile(profile);
        if (triggerBanner) {
          setHasUnverifiedCard(!profile.is_verified);
        }
        setLoadingPaymentProfile(false);
        return !profile.is_verified;
      } catch (error) {
        setLoadingError(true);
        CaptureException(error as Error);
        setLoadingPaymentProfile(false);
        return false;
      }
    },
    [getPaymentProfiles],
  );

  // Check if user has a failed payment
  const [loadingPaymentStatus, setLoadingPaymentStatus] = useState<boolean>(true);
  const [hasFailedPayment, setHasFailedPayment] = useState<boolean>(false);

  const resolvePaymentStatus = useCallback(
    async (triggerBanner: boolean) => {
      try {
        const { hasFailedPayment: failedPayment } = await getAdAccountStatus();
        if (triggerBanner) {
          setHasFailedPayment(failedPayment);
        }
        setLoadingPaymentStatus(false);
        return failedPayment;
      } catch (error) {
        setLoadingError(true);
        CaptureException(error as Error);
        openErrorDialog();
        setLoadingPaymentStatus(false);
        return false;
      }
    },
    [getAdAccountStatus],
  );

  // On page load, retrieve balance and any account issues that require a banner
  useEffect(() => {
    // Trigger first payment added CTA modal
    if (router.query.state === BuyAdCreditEnum.SUCCESS_AND_FIRST_PAYMENT_METHOD) {
      openFirstPaymentMethodCTADialog(buyAdCredSuccessMessage);
    } else if (router.query.state === CardVerificationResultEnum.SUCCESS_AND_FIRST_PAYMENT_METHOD) {
      openFirstPaymentMethodCTADialog(saveCardSuccessMessage);
    }
    resolvePaymentProfile(true);
    resolvePaymentStatus(true);
    resolveBalance();
    getAutoReloadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isWorkspaceLoading || !groupId) {
      return;
    }

    getAutoReloadData(groupId);
  }, [getAutoReloadData, groupId, isWorkspaceLoading]);

  useEffect(() => {
    if (isWorkspaceLoading || !groupId) {
      return;
    }

    getAdvertiser(false, groupId).catch((error) => {
      CaptureException(error as Error);
    });
  }, [getAdvertiser, groupId, isWorkspaceLoading]);

  useEffect(() => {
    if (isWorkspaceLoading || !groupId) {
      return;
    }

    getAdCredit(groupId).catch((error) => {
      CaptureException(error as Error);
    });
  }, [getAdCredit, groupId, isWorkspaceLoading]);

  // Display banners based on account status
  let unifiedPaymentStatusToast: ReactNode;
  if (
    loadingPaymentProfile ||
    loadingPaymentStatus ||
    (adCreditActivated && advertisingEnabled.advertisingShouldBeEnabled)
  ) {
    unifiedPaymentStatusToast = null;
  } else {
    unifiedPaymentStatusToast = (
      <UnifiedPaymentStatusToast
        failedCardAuthorization={showFailedCardAuthBanner}
        hasActiveChallenge={paymentProfile?.has_active_challenge}
        hasFailedPayment={hasFailedPayment}
        hasNoPaymentMethod={(paymentProfile === null || hasUnverifiedCard) && !adCreditActivated}
        hasUnknownError={showUnknownErrorBanner}
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
        somethingWentWrong={showSomethingWentWrongBanner}
      />
    );
  }

  const redirectToAddPaymentMethodPage = () => {
    router.push({
      pathname: Routes.ADD_PAYMENT,
    });
  };

  const handleGroupReloadBalanceClick = () => {
    if (!groupId) {
      return;
    }

    navigateToGroupReloadAdCredit({
      entryPoint: 'paymentSettingsReloadGroupAdCredit',
      groupAdvertiserState,
      groupId,
      groupName: currentWorkspace?.creatorName || translate('Label.RobloxAdCredit'),
      router,
    });
  };

  // Display payment methods based on account view
  let noPaymentMethodsComponent: ReactNode | null = null;
  let cardComponentCard: ReactNode | null = null;
  let groupAdCreditComponentCard: ReactNode | null = null;
  let adCreditComponentCard: ReactNode | null = null;
  if (loadingPaymentProfile) {
    // No action needed, all variables are already initialized as null
  } else if (paymentProfile === null && !adCreditActivated && !groupId) {
    noPaymentMethodsComponent = <NoPaymentMethods />;
  } else if (isGroupAccountViewWithId) {
    groupAdCreditComponentCard = (
      <BillingPaymentMethodSection>
        <RobloxAdCreditChip />
        <AdCreditBalance
          adCreditBalance={groupAdCreditBalance}
          groupId={groupId}
          heading={translate('Heading.AvailableBalance')}
          isError={isGroupAdCreditError}
          isLoading={isGroupAdCreditLoading}
          onReloadBalanceClick={handleGroupReloadBalanceClick}
          reloadBalanceScope={AdCreditBalanceScope.Group}
        />
      </BillingPaymentMethodSection>
    );
  } else {
    if (paymentProfile) {
      cardComponentCard = (
        <BillingPaymentMethodSection>
          <CreditCardSummary paymentProfile={paymentProfile} />
          <CardOutstandingBalance
            balance={balance}
            hasFailedPayment={hasFailedPayment}
            paymentThreshold={paymentThreshold}
          />
        </BillingPaymentMethodSection>
      );
    }
    if (adCreditActivated) {
      adCreditComponentCard = (
        <BillingPaymentMethodSection>
          <RobloxAdCreditChip />
          <AdCreditBalance
            adCreditBalance={adCreditBalance}
            heading={showAccountViewSwitcher ? translate('Heading.AvailableBalance') : undefined}
            reloadBalanceScope={AdCreditBalanceScope.Personal}
          />
        </BillingPaymentMethodSection>
      );
    }
  }

  if (loadingError) {
    return (
      <div className='flex justify-center padding-xxlarge'>
        <span className='text-heading-medium content-emphasis'>
          {translate('Message.FailedToFetchData')}
        </span>
      </div>
    );
  }

  if (loadingBalance || loadingPaymentProfile) {
    return <CenteredCircularProgress />;
  }

  const loadingDataForButtonRender = loadingPaymentProfile && loadingBalance;
  const showAddPaymentMethodButton =
    !loadingDataForButtonRender &&
    !isGroupAccountViewWithId &&
    (!adCreditBalance || (userOver18 && !loadingPaymentProfile && !paymentProfile)) &&
    !noPaymentMethodsComponent;

  return (
    <div className='flex flex-col gap-xxlarge'>
      {snackBar}
      {unifiedPaymentStatusToast || <PaymentSettingsStackedToasts />}
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
      {showAddPaymentMethodButton ? (
        <div>
          <Button
            data-testid='addPaymentMethodButton'
            onClick={() => redirectToAddPaymentMethodPage()}
            size='Medium'
            variant='Emphasis'>
            {translate('Heading.AddPaymentMethod')}
          </Button>
        </div>
      ) : null}
      {noPaymentMethodsComponent}
      {userOver18 && cardComponentCard}
      {groupAdCreditComponentCard}
      {adCreditComponentCard}
    </div>
  );
};

export default PaymentSettings;
