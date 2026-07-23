import { Icon } from '@rbx/foundation-ui';
import moment from 'moment-timezone';

import PaymentMethodIcon from '@components/common/PaymentMethodIcon';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { PaymentProfileType } from '@type/payment';

interface CreditCardSummaryProps {
  paymentProfile: PaymentProfileType;
}

const CreditCardSummary = ({ paymentProfile }: CreditCardSummaryProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);

  const showExpirationDate = (year: number, month: number) => {
    // TODO: use locale for date format
    const date = new Date(year, month - 1, 1);
    return moment(date).format('MM/YY');
  };

  return (
    <div className='flex shrink-0 flex-col gap-small' data-testid='creditCardContainer'>
      <div className='flex height-[77px] width-[110px] items-center justify-center radius-small bg-[#ffffff]'>
        <PaymentMethodIcon
          largeIcon
          paymentMethodType={paymentProfile.card_network}
          smallIcon={false}
        />
      </div>
      <div className='flex flex-col'>
        <span className='text-caption-medium content-emphasis' data-testid='creditCardNumber'>
          **** {paymentProfile.last_four_digits}
        </span>
        <span className='text-body-small content-default' data-testid='expirationDate'>
          {translate('Description.Exp')}
          {showExpirationDate(paymentProfile.exp_year, paymentProfile.exp_month)}
        </span>
      </div>
      <div className='flex items-center gap-xsmall'>
        {paymentProfile.is_verified ? (
          <Icon
            className='content-system-success'
            data-testid='checkmarkIcon'
            name='icon-regular-circle-check'
            size='Small'
          />
        ) : (
          <Icon
            className='content-system-warning'
            data-testid='warningIcon'
            name='icon-regular-triangle-exclamation'
            size='Small'
          />
        )}
        <span className='text-body-small content-muted'>
          {paymentProfile.is_verified ? translate('Label.Verified') : translate('Label.Unverified')}
        </span>
      </div>
    </div>
  );
};

export default CreditCardSummary;
