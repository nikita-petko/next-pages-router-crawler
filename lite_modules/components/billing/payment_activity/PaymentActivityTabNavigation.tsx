import { Tabs } from '@rbx/ui';
import { noop } from 'lodash';
import { ChangeEvent, ReactElement, useMemo } from 'react';

import CardOutstandingBalance from '@components/billing/balance/CardOutstandingBalance';
import BillingPaymentMethodSection, {
  RobloxAdCreditChip,
} from '@components/billing/common/BillingPaymentMethodSection';
import CustomTabPanel from '@components/billing/common/CustomTabPanel';
import AdCreditTransactionHistoryContainer from '@components/billing/payment_activity/AdCreditTransactionHistoryContainer';
import CardTransactionHistoryContainer from '@components/billing/payment_activity/CardTransactionHistoryContainer';
import PaymentActivityTab from '@components/billing/payment_activity/PaymentActivityTab';
import AdCreditBalance from '@components/billing/payment_settings/AdCreditBalance';
import CreditCardSummary from '@components/billing/payment_settings/CreditCardSummary';
import { AdCreditBalanceScope, PaymentActivityTabType } from '@constants/billing';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { PaymentProfileType } from '@type/payment';

const tabPanelContentClassName = 'flex min-width-0 flex-col gap-xxlarge padding-top-xlarge';

interface PaymentActivityTabsNavigationProps {
  accountView: AdCreditBalanceScope;
  adCreditBalance: number;
  cardBalance: number | null;
  changeTabCb: (tab: PaymentActivityTabType) => void;
  groupAdCreditBalance?: number;
  groupId?: number;
  hasFailedPayment: boolean;
  isAdCreditActivated: boolean;
  isCardActivated: boolean;
  isGroupAdCreditError?: boolean;
  isGroupAdCreditLoading?: boolean;
  onGroupReloadBalanceClick?: () => void;
  paymentProfile: PaymentProfileType | null;
  paymentThreshold: number;
  selectedTab: PaymentActivityTabType;
}

const PaymentActivityTabsNavigation = ({
  accountView,
  adCreditBalance,
  cardBalance,
  changeTabCb = noop,
  groupAdCreditBalance = 0,
  groupId,
  hasFailedPayment,
  isAdCreditActivated,
  isCardActivated,
  isGroupAdCreditError = false,
  isGroupAdCreditLoading = false,
  onGroupReloadBalanceClick,
  paymentProfile,
  paymentThreshold,
  selectedTab = PaymentActivityTabType.CARD_PAYMENT_ACTIVITY_TAB,
}: PaymentActivityTabsNavigationProps): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);

  const isGroupAccountView = accountView === AdCreditBalanceScope.Group && groupId !== undefined;
  const showCardTab = isCardActivated && !isGroupAccountView;
  const showAdCreditTab = isAdCreditActivated || isGroupAccountView;

  const visibleTabValues = useMemo(
    () =>
      [
        showCardTab ? PaymentActivityTabType.CARD_PAYMENT_ACTIVITY_TAB : null,
        showAdCreditTab ? PaymentActivityTabType.AD_CREDIT_PAYMENT_ACTIVITY_TAB : null,
      ].filter((tabValue): tabValue is PaymentActivityTabType => tabValue !== null),
    [showAdCreditTab, showCardTab],
  );
  const visibleValue = visibleTabValues.includes(selectedTab) ? selectedTab : visibleTabValues[0];

  const handleChangeTab = (_event: ChangeEvent<object>, newValue: unknown) => {
    changeTabCb(newValue as PaymentActivityTabType);
  };

  if (visibleTabValues.length === 0) {
    return (
      <div className='radius-medium bg-shift-100 padding-xxlarge'>
        <span
          className='text-heading-small content-emphasis'
          data-testid='noTransactionHistoryText'>
          {translate('Description.NoTransactionHistoryV2')}
        </span>
      </div>
    );
  }

  const isSoloTab = visibleTabValues.length === 1;
  const selectedAdCreditBalance = isGroupAccountView ? groupAdCreditBalance : adCreditBalance;
  const selectedAdCreditGroupId = isGroupAccountView ? groupId : undefined;
  const adCreditHistoryKey =
    selectedAdCreditGroupId !== undefined ? `group-${selectedAdCreditGroupId}` : 'personal';

  return (
    <div className='flex flex-col width-full' data-testid='paymentActivityTabNavigation'>
      <Tabs onChange={handleChangeTab} value={visibleValue}>
        {showCardTab ? (
          <PaymentActivityTab
            currentValue={visibleValue}
            data-testid={showAdCreditTab ? 'card-tab' : 'card-tab-solo'}
            isSoloTab={isSoloTab}
            key='card'
            tabType={PaymentActivityTabType.CARD_PAYMENT_ACTIVITY_TAB}
            value={PaymentActivityTabType.CARD_PAYMENT_ACTIVITY_TAB}
          />
        ) : null}
        {showAdCreditTab ? (
          <PaymentActivityTab
            currentValue={visibleValue}
            data-testid={showCardTab ? 'ad-credit-tab' : 'ad-credit-tab-solo'}
            isSoloTab={isSoloTab}
            key='ad-credit'
            tabType={PaymentActivityTabType.AD_CREDIT_PAYMENT_ACTIVITY_TAB}
            value={PaymentActivityTabType.AD_CREDIT_PAYMENT_ACTIVITY_TAB}
          />
        ) : null}
      </Tabs>

      {showCardTab ? (
        <CustomTabPanel
          index={PaymentActivityTabType.CARD_PAYMENT_ACTIVITY_TAB}
          key='card-panel'
          value={visibleValue}>
          <div className={tabPanelContentClassName}>
            {paymentProfile && cardBalance !== null ? (
              <BillingPaymentMethodSection>
                <CreditCardSummary paymentProfile={paymentProfile} />
                <CardOutstandingBalance
                  balance={cardBalance}
                  hasFailedPayment={hasFailedPayment}
                  paymentThreshold={paymentThreshold}
                  showReplaceCardButton={false}
                />
              </BillingPaymentMethodSection>
            ) : null}
            <CardTransactionHistoryContainer />
          </div>
        </CustomTabPanel>
      ) : null}

      {showAdCreditTab ? (
        <CustomTabPanel
          index={PaymentActivityTabType.AD_CREDIT_PAYMENT_ACTIVITY_TAB}
          key='ad-credit-panel'
          value={visibleValue}>
          <div className={tabPanelContentClassName}>
            <BillingPaymentMethodSection>
              <RobloxAdCreditChip />
              <AdCreditBalance
                adCreditBalance={selectedAdCreditBalance}
                groupId={selectedAdCreditGroupId}
                heading={translate('Heading.AvailableBalance')}
                isError={isGroupAccountView ? isGroupAdCreditError : false}
                isLoading={isGroupAccountView ? isGroupAdCreditLoading : false}
                onReloadBalanceClick={isGroupAccountView ? onGroupReloadBalanceClick : undefined}
                reloadBalanceScope={
                  isGroupAccountView ? AdCreditBalanceScope.Group : AdCreditBalanceScope.Personal
                }
                showAutoReloadSection={false}
              />
            </BillingPaymentMethodSection>
            <AdCreditTransactionHistoryContainer
              groupId={selectedAdCreditGroupId}
              key={adCreditHistoryKey}
            />
          </div>
        </CustomTabPanel>
      ) : null}
    </div>
  );
};

export default PaymentActivityTabsNavigation;
