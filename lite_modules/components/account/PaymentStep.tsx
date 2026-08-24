import { Tab, Tabs } from '@rbx/ui';
import { ChangeEvent } from 'react';

import AccountScopedBuyAdCredit from '@components/billing/AccountScopedBuyAdCredit';
import useAddPaymentMethodStyles from '@components/billing/AddPaymentMethod.styles';
import type { PaymentSetupCompletion } from '@components/billing/BuyAdCredit';
import CustomTabPanel from '@components/billing/common/CustomTabPanel';
import StripeElementsProvider from '@components/billing/common/StripeElementsProvider';
import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import { AdCreditBalanceScope, ADD_PAYMENT_TABS } from '@constants/billing';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';

interface PaymentStepProps {
  actionsContainer?: HTMLDivElement | null;
  adCreditBalance: number;
  groupAdCreditBalance?: number;
  groupId?: number;
  groupName?: string;
  groupRobuxBalance?: number;
  initialBalanceScope?: AdCreditBalanceScope;
  isAdCreditPurchaseOnly?: boolean;
  isDrawer?: boolean;
  isGroupSpendPermissionDenied?: boolean;
  isUnlocked: boolean;
  isWorkspaceMetadataResolved?: boolean;
  onCancel?: () => void;
  onComplete?: (completion: PaymentSetupCompletion) => void;
  onPaymentTabChange: (tab: ADD_PAYMENT_TABS) => void;
  paymentDataLoading: boolean;
  paymentTab: ADD_PAYMENT_TABS;
  robuxBalance: number;
  showGroupBalanceOption?: boolean;
  userOver18: boolean;
}

const PaymentStep = ({
  actionsContainer,
  adCreditBalance,
  groupAdCreditBalance,
  groupId,
  groupName,
  groupRobuxBalance,
  initialBalanceScope,
  isAdCreditPurchaseOnly = false,
  isDrawer = false,
  isGroupSpendPermissionDenied = false,
  isUnlocked,
  isWorkspaceMetadataResolved = true,
  onCancel,
  onComplete,
  onPaymentTabChange,
  paymentDataLoading,
  paymentTab,
  robuxBalance,
  showGroupBalanceOption,
  userOver18,
}: PaymentStepProps) => {
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateBilling } = useNamespacedTranslation(TranslationNamespace.Billing);
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
  const showBalanceScopeSelector =
    !isAdCreditPurchaseOnly ||
    (initialBalanceScope === AdCreditBalanceScope.Group && isGroupSpendPermissionDenied);
  const {
    classes: {
      buyAdCreditFormContainer,
      buyAdCreditFormContainerCentered,
      creditCardFormContainer,
      stepLockedMessage,
      tab,
      tabs,
      tabSelected,
    },
  } = useAddPaymentMethodStyles();

  if (!isUnlocked) {
    return (
      <span className={`text-body-medium ${stepLockedMessage}`}>
        {translateAccount('Description.CompleteStepAbove')}
      </span>
    );
  }

  if (paymentDataLoading) {
    return <CenteredCircularProgress />;
  }

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
      {userOver18 && !isAdCreditPurchaseOnly && (
        <Tabs
          className={tabs}
          onChange={(_e: ChangeEvent<object>, newValue: unknown) => {
            onPaymentTabChange(newValue as ADD_PAYMENT_TABS);
          }}
          value={paymentTab}
          variant='fullWidth'>
          <Tab
            className={paymentTab === ADD_PAYMENT_TABS.CREDIT_CARD ? tabSelected : tab}
            data-testid='creditCardTab'
            disableTouchRipple
            label={translateBilling('Title.Card')}
            value={ADD_PAYMENT_TABS.CREDIT_CARD}
          />
          <Tab
            className={paymentTab === ADD_PAYMENT_TABS.ADS_CREDIT ? tabSelected : tab}
            data-testid='robuxAdCreditTab'
            disableTouchRipple
            label={translateBilling('Title.AdCredit')}
            value={ADD_PAYMENT_TABS.ADS_CREDIT}
          />
        </Tabs>
      )}
      <CustomTabPanel index={0} value={Object.values(ADD_PAYMENT_TABS).indexOf(paymentTab)}>
        <div className={isDrawer ? buyAdCreditFormContainerCentered : buyAdCreditFormContainer}>
          <AccountScopedBuyAdCredit
            actionsContainer={
              paymentTab === ADD_PAYMENT_TABS.ADS_CREDIT ? actionsContainer : undefined
            }
            adCreditBalance={adCreditBalance}
            groupAdCreditBalance={groupAdCreditBalance}
            groupId={groupId}
            groupName={groupName}
            groupRobuxBalance={groupRobuxBalance}
            groupWatermarkedRobuxConversionEnabled={groupWatermarkedRobuxConversionEnabled}
            initialBalanceScope={initialBalanceScope}
            isGroupSpendPermissionDenied={isGroupSpendPermissionDenied}
            onCancel={onCancel}
            onComplete={onComplete}
            personalWatermarkedRobuxConversionEnabled={personalWatermarkedRobuxConversionEnabled}
            robuxBalance={robuxBalance}
            showBalanceScopeSelector={showBalanceScopeSelector}
            showGroupBalanceOption={showGroupBalanceOption}
          />
        </div>
      </CustomTabPanel>
      {!isAdCreditPurchaseOnly && (
        <CustomTabPanel index={1} value={Object.values(ADD_PAYMENT_TABS).indexOf(paymentTab)}>
          <div className={creditCardFormContainer}>
            <StripeElementsProvider
              actionsContainer={
                paymentTab === ADD_PAYMENT_TABS.CREDIT_CARD ? actionsContainer : undefined
              }
              centerButtons={false}
              onCancel={onCancel}
              onComplete={
                onComplete
                  ? () => onComplete({ accountScope: 'user', paymentMethodType: 'card' })
                  : undefined
              }
            />
          </div>
        </CustomTabPanel>
      )}
    </>
  );
};

export default PaymentStep;
