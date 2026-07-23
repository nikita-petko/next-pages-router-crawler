import { Icon } from '@rbx/foundation-ui';
import { Tab } from '@rbx/ui';
import { ReactElement } from 'react';

import AddCreditCardIcon from '@components/billing/common/AddCreditCardIcon';
import usePaymentActivityTabStyles from '@components/billing/payment_activity/PaymentActivityTab.styles';
import { PaymentActivityTabType } from '@constants/billing';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

interface PaymentActivityTabProps {
  currentValue: number;
  isSoloTab: boolean;
  tabType: PaymentActivityTabType;
  value?: string | number;
}

const PaymentActivityTab = ({
  currentValue,
  isSoloTab,
  tabType,
  value,
  ...restProps
}: PaymentActivityTabProps): ReactElement => {
  const { translate: translateBilling } = useNamespacedTranslation(TranslationNamespace.Billing);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: { soloTab, tab, tabLabel, tabSelected },
  } = usePaymentActivityTabStyles();

  const isSelected = currentValue === value;
  let className = tab;
  if (isSoloTab) {
    className = soloTab;
  } else if (isSelected) {
    className = tabSelected;
  }

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

  return (
    <Tab className={className} disableTouchRipple label={label} value={value} {...restProps} />
  );
};

export default PaymentActivityTab;
