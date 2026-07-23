import { Tab, Tabs } from '@rbx/ui';
import { ChangeEvent } from 'react';

import useAddPaymentMethodStyles from '@components/billing/AddPaymentMethod.styles';
import { BuyAdCredit, type PaymentSetupCompletion } from '@components/billing/BuyAdCredit';
import CustomTabPanel from '@components/billing/common/CustomTabPanel';
import StripeElementsProvider from '@components/billing/common/StripeElementsProvider';
import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import { AdCreditBalanceScope, ADD_PAYMENT_TABS } from '@constants/billing';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

interface PaymentStepProps {
  actionsContainer?: HTMLDivElement | null;
  adCreditBalance: number;
  groupAdCreditBalance?: number;
  groupId?: number;
  groupName?: string;
  groupRobuxBalance?: number;
  initialBalanceScope?: AdCreditBalanceScope;
  isUnlocked: boolean;
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
  isUnlocked,
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
  const {
    classes: {
      buyAdCreditFormContainer,
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

  return (
    <>
      {userOver18 && (
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
        <div className={buyAdCreditFormContainer}>
          <BuyAdCredit
            actionsContainer={
              paymentTab === ADD_PAYMENT_TABS.ADS_CREDIT ? actionsContainer : undefined
            }
            adCreditBalance={adCreditBalance}
            groupAdCreditBalance={groupAdCreditBalance}
            groupId={groupId}
            groupName={groupName}
            groupRobuxBalance={groupRobuxBalance}
            initialBalanceScope={initialBalanceScope}
            onCancel={onCancel}
            onComplete={onComplete}
            robuxBalance={robuxBalance}
            showGroupBalanceOption={showGroupBalanceOption}
          />
        </div>
      </CustomTabPanel>
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
    </>
  );
};

export default PaymentStep;
