import { useWorkspaces } from '@rbx/creator-hub-navigation';
import { Icon, Tabs, TabsList, TabsTrigger } from '@rbx/foundation-ui';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

import AccountScopedBuyAdCredit from '@components/billing/AccountScopedBuyAdCredit';
import useAddPaymentMethodStyles from '@components/billing/AddPaymentMethod.styles';
import type { BuyAdCreditProps } from '@components/billing/BuyAdCredit';
import AddCreditCardIcon from '@components/billing/common/AddCreditCardIcon';
import CustomTabPanel from '@components/billing/common/CustomTabPanel';
import StripeElementsProvider from '@components/billing/common/StripeElementsProvider';
import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import { openErrorDialog } from '@components/common/dialog/errorDialog';
import { openImpersonationErrorDialog } from '@components/common/dialog/impersonationErrorDialog';
import {
  ADD_PAYMENT_TABS,
  parseAdCreditBalanceScopeFromQuery,
  PaymentMethodActionEnum,
} from '@constants/billing';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useCurrentWorkspaceMetadata from '@hooks/useCurrentWorkspaceMetadata';
import useGroupSpendPermission from '@hooks/useGroupSpendPermission';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { getGroupRobuxBalance, getRobuxBalance } from '@services/economy/robuxService';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { CaptureException } from '@utils/error';
import { getSelectedGroupId } from '@utils/groupScopedAccount';

const AddPaymentMethodTabsNavigation = ({
  adCreditBalance,
  groupAdCreditBalance,
  groupId,
  groupName,
  groupRobuxBalance,
  initialBalanceScope,
  isGroupSpendPermissionDenied,
  robuxBalance,
  showGroupBalanceOption,
}: BuyAdCreditProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  const {
    classes: { buyAdCreditFormContainer, creditCardFormContainer, tabs },
  } = useAddPaymentMethodStyles();

  const router = useRouter();
  const userOver18 = useAppStore((state: AppStoreType) => state.appData.userOver18);
  const personalWatermarkedRobuxConversionEnabled = useAppStore(
    (state: AppStoreType) =>
      state.appMetadataState?.data?.isWatermarkedRobuxConversionEnabled ??
      state.appMetadataBaseData?.isWatermarkedRobuxConversionEnabled ??
      false,
  );
  const groupWatermarkedRobuxConversionEnabled = useAppStore(
    (state: AppStoreType) =>
      state.appMetadataState?.data?.isWatermarkedRobuxConversionEnabledForAdGroup ?? false,
  );
  const { isResolved: isWorkspaceMetadataResolved } = useCurrentWorkspaceMetadata();

  const [value, setValue] = useState<ADD_PAYMENT_TABS>(
    router.query.action === PaymentMethodActionEnum.RELOAD_AD_CREDIT || !userOver18
      ? ADD_PAYMENT_TABS.ADS_CREDIT
      : ADD_PAYMENT_TABS.CREDIT_CARD,
  );

  const showTabs =
    (router.query.action === undefined || router.query.action === PaymentMethodActionEnum.ADD) &&
    userOver18;

  const handleChangeTab = (newValue: string) => {
    setValue(newValue as ADD_PAYMENT_TABS);
  };

  const isGroupMetadataPending =
    groupId !== undefined &&
    showGroupBalanceOption &&
    !isGroupSpendPermissionDenied &&
    !isWorkspaceMetadataResolved;

  if (isGroupMetadataPending) {
    return <CenteredCircularProgress />;
  }

  return (
    <>
      {showTabs && (
        <Tabs className={tabs} onValueChange={handleChangeTab} value={value} variant='Inlined'>
          <TabsList>
            <TabsTrigger data-testid='creditCardTab' value={ADD_PAYMENT_TABS.CREDIT_CARD}>
              <span className='flex items-center gap-small'>
                <AddCreditCardIcon />
                {translate('Title.Card')}
              </span>
            </TabsTrigger>
            <TabsTrigger data-testid='robuxAdCreditTab' value={ADD_PAYMENT_TABS.ADS_CREDIT}>
              <span className='flex items-center gap-small'>
                <Icon name='icon-filled-robux' size='Medium' />
                {translate('Title.RobuxAdCredit')}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      <CustomTabPanel index={0} value={Object.values(ADD_PAYMENT_TABS).indexOf(value)}>
        <div className={buyAdCreditFormContainer}>
          <AccountScopedBuyAdCredit
            adCreditBalance={adCreditBalance}
            groupAdCreditBalance={groupAdCreditBalance}
            groupId={groupId}
            groupName={groupName}
            groupRobuxBalance={groupRobuxBalance}
            groupWatermarkedRobuxConversionEnabled={groupWatermarkedRobuxConversionEnabled}
            initialBalanceScope={initialBalanceScope}
            isGroupSpendPermissionDenied={isGroupSpendPermissionDenied}
            personalWatermarkedRobuxConversionEnabled={personalWatermarkedRobuxConversionEnabled}
            robuxBalance={robuxBalance}
            showBalanceScopeSelector
            showGroupBalanceOption={showGroupBalanceOption}
          />
        </div>
      </CustomTabPanel>
      <CustomTabPanel index={1} value={Object.values(ADD_PAYMENT_TABS).indexOf(value)}>
        <div className={creditCardFormContainer}>
          <StripeElementsProvider centerButtons={false} />
        </div>
      </CustomTabPanel>
    </>
  );
};

const AddPaymentMethod = () => {
  const [adCreditBalance, setAdCreditBalance] = useState<number>(0);
  const [groupAdCreditBalance, setGroupAdCreditBalance] = useState<number>(0);
  const [groupRobuxBalance, setGroupRobuxBalance] = useState<number>(0);
  const [robuxBalance, setRobuxBalance] = useState<number>(0);
  const [adCreditBalanceLoading, setAdCreditBalanceLoading] = useState<boolean>(true);
  const [groupBalanceError, setGroupBalanceError] = useState<boolean>(false);
  const [groupBalanceLoaded, setGroupBalanceLoaded] = useState<boolean>(false);
  const [groupBalanceLoading, setGroupBalanceLoading] = useState<boolean>(false);
  const [robuxBalanceLoading, setRobuxBalanceLoading] = useState<boolean>(true);

  const router = useRouter();
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspaces();
  const isAdAccountAutoCreateEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const groupId = getSelectedGroupId(currentWorkspace, isAdAccountAutoCreateEnabled);
  const { isGroupSpendPermissionDenied, isLoading: groupSpendPermissionLoading } =
    useGroupSpendPermission(groupId);

  const getAdCredit = useAppStore((state: AppStoreType) => state.getAdCredit);

  const fetchAdCreditBalance = useCallback(async () => {
    try {
      const response = await getAdCredit();
      const { ad_credit_balance_in_micro } = response || {};
      setAdCreditBalance(ad_credit_balance_in_micro || 0);
    } catch (e) {
      CaptureException(e as Error);
      openErrorDialog();
    } finally {
      setAdCreditBalanceLoading(false);
    }
  }, [getAdCredit]);

  const fetchRobuxBalance = useCallback(async () => {
    try {
      const { robux } = await getRobuxBalance();
      setRobuxBalance(robux);
    } catch (e) {
      CaptureException(e as Error);
      openErrorDialog();
    } finally {
      setRobuxBalanceLoading(false);
    }
  }, []);

  const fetchGroupBalances = useCallback(async () => {
    if (!groupId) {
      setGroupBalanceError(false);
      setGroupBalanceLoaded(true);
      setGroupBalanceLoading(false);
      return;
    }
    if (isGroupSpendPermissionDenied) {
      setGroupBalanceError(false);
      setGroupAdCreditBalance(0);
      setGroupRobuxBalance(0);
      setGroupBalanceLoaded(true);
      setGroupBalanceLoading(false);
      return;
    }

    setGroupBalanceError(false);
    setGroupBalanceLoaded(false);
    setGroupBalanceLoading(true);
    const [adCreditResult, robuxResult] = await Promise.allSettled([
      getAdCredit(groupId),
      getGroupRobuxBalance(groupId),
    ]);

    if (adCreditResult.status === 'fulfilled') {
      setGroupAdCreditBalance(adCreditResult.value?.ad_credit_balance_in_micro || 0);
    } else {
      CaptureException(adCreditResult.reason as Error);
      setGroupBalanceError(true);
      setGroupAdCreditBalance(0);
    }

    if (robuxResult.status === 'fulfilled') {
      setGroupRobuxBalance(robuxResult.value.robux);
    } else {
      CaptureException(robuxResult.reason as Error);
      setGroupBalanceError(true);
      setGroupRobuxBalance(0);
    }

    setGroupBalanceLoaded(true);
    setGroupBalanceLoading(false);
  }, [getAdCredit, groupId, isGroupSpendPermissionDenied]);

  // On page load, retrieve balance, payment activity, and any account issues that require a banner
  useEffect(() => {
    // prevents Add Payment pages from being viewed in impersonation mode
    const impCookieExists = document.cookie.includes('ad-account-imp-info');
    const { action } = router.query;
    const path = router.asPath;
    const isRestrictedPage =
      action === PaymentMethodActionEnum.RELOAD_AD_CREDIT ||
      action === PaymentMethodActionEnum.ADD ||
      action === PaymentMethodActionEnum.UPDATE_CARD ||
      path.includes(Routes.ADD_PAYMENT);
    if (impCookieExists && isRestrictedPage) {
      openImpersonationErrorDialog();
    } else {
      fetchAdCreditBalance();
      fetchRobuxBalance();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isWorkspaceLoading || groupSpendPermissionLoading) {
      return;
    }

    fetchGroupBalances();
  }, [fetchGroupBalances, groupSpendPermissionLoading, isWorkspaceLoading]);

  if (
    adCreditBalanceLoading ||
    robuxBalanceLoading ||
    isWorkspaceLoading ||
    groupSpendPermissionLoading ||
    groupBalanceLoading ||
    (Boolean(groupId) && !groupBalanceLoaded)
  ) {
    return <CenteredCircularProgress />;
  }

  const initialBalanceScope = parseAdCreditBalanceScopeFromQuery(router.query.balanceScope);
  const showGroupBalanceOption =
    Boolean(groupId) && (!groupBalanceError || isGroupSpendPermissionDenied);

  return (
    <div data-testid='addPaymentMethodContainer'>
      <AddPaymentMethodTabsNavigation
        adCreditBalance={adCreditBalance}
        groupAdCreditBalance={groupAdCreditBalance}
        groupId={groupId}
        groupName={currentWorkspace.creatorName}
        groupRobuxBalance={groupRobuxBalance}
        initialBalanceScope={initialBalanceScope}
        isGroupSpendPermissionDenied={isGroupSpendPermissionDenied}
        robuxBalance={robuxBalance}
        showGroupBalanceOption={showGroupBalanceOption}
      />
    </div>
  );
};

export default AddPaymentMethod;
