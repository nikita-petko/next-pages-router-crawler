import { Icon, TabsTrigger } from '@rbx/foundation-ui';
import { ReactElement } from 'react';

import AddCreditCardIcon from '@components/billing/common/AddCreditCardIcon';
import usePaymentActivityTabStyles from '@components/billing/payment_activity/PaymentActivityTab.styles';
import { PaymentActivityTabType } from '@constants/billing';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

interface PaymentActivityTabProps {
  isSoloTab: boolean;
  tabType: PaymentActivityTabType;
  value: PaymentActivityTabType;
}

const PaymentActivityTab = ({
  isSoloTab,
  tabType,
  value,
  ...restProps
}: PaymentActivityTabProps): ReactElement => {
  const { translate: translateBilling } = useNamespacedTranslation(TranslationNamespace.Billing);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: { soloTab, tabLabel, verticallyCenteredTab },
    cx,
  } = usePaymentActivityTabStyles();

  const label =
    tabType === PaymentActivityTabType.CARD_PAYMENT_ACTIVITY_TAB ? (
      <span className={tabLabel}>
        <AddCreditCardIcon />
        {translateCampaign('Label.CreditCard')}
      </span>
    ) : (
      <span className={tabLabel}>
        <Icon name='icon-filled-robux' size='Small' />
        {translateBilling('Title.AdCredit')}
      </span>
    );

  // Radix keys tabs by string, so the numeric PaymentActivityTabType is
  // stringified here and parsed back in the navigation's onValueChange.
  return (
    <TabsTrigger
      className={cx(verticallyCenteredTab, isSoloTab && soloTab)}
      value={String(value)}
      {...restProps}>
      {label}
    </TabsTrigger>
  );
};

export default PaymentActivityTab;
